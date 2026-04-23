import {
  authentication, type AuthenticationClient, createDirectus, rest, type RestClient,
} from '@directus/sdk';
import Bottleneck from 'bottleneck';

import {DirectusCliError, type SdkRestCommand} from '../types/index.js';

// Global rate limiter: 10 concurrent, 50 req/s reservoir
const limiter = new Bottleneck({
  maxConcurrent: 10,
  reservoir: 50,
  reservoirRefreshAmount: 50,
  reservoirRefreshInterval: 1000,
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Client configuration options
 */
export interface ClientOptions {
  accessToken?: string;
  /**
   * Optional callback invoked when a request fails with HTTP 401.
   * Should attempt to refresh the access token and return the new token on
   * success, or `null` if refresh is not possible (e.g. no refresh token or
   * refresh token itself is rejected). When a token is returned, the original
   * request is retried exactly once.
   */
  onRefresh?: () => Promise<null | string>;
  refreshToken?: string;
  token?: string;
  url: string;
  verbose?: boolean;
}

/**
 * Custom Directus client wrapper with rate limiting and retry logic.
 */
export class DirectusClient {
  private client: AuthenticationClient<unknown> & RestClient<unknown>;
  private isStaticToken: boolean;
  private onRefresh?: () => Promise<null | string>;
  private refreshToken?: string;
  private url: string;
  private verbose: boolean;

  constructor(options: ClientOptions) {
    this.refreshToken = options.refreshToken;
    this.url = options.url;
    this.verbose = options.verbose ?? false;
    this.onRefresh = options.onRefresh;
    this.isStaticToken = Boolean(options.token);

    const builder = createDirectus<unknown>(options.url)
    .with(rest())
    .with(authentication('json', {credentials: 'omit'}));

    // Cast through unknown to handle type mismatch between builder and expected type
    this.client = builder as unknown as AuthenticationClient<unknown> & RestClient<unknown>;

    // Set static token if provided
    if (options.token) {
      this.client.setToken(options.token);
    } else if (options.accessToken) {
      this.client.setToken(options.accessToken);
    }
  }

  /**
   * Disconnect and clean up resources (Bottleneck limiter).
   * Call this when done with the client to allow the process to exit cleanly.
   */
  async destroy(): Promise<void> {
    await limiter.disconnect();
  }

  /**
   * Get the underlying SDK client (for advanced use cases).
   */
  getSdkClient(): AuthenticationClient<unknown> & RestClient<unknown> {
    return this.client;
  }

  /**
   * Get the configured URL.
   */
  getUrl(): string {
    return this.url;
  }

  /**
   * Login with email and password.
   */
  async login(
    email: string,
    password: string,
  ): Promise<{accessToken: string; expires?: number; refreshToken?: string}> {
    try {
      const result = await this.client.login({email, password});
      if (!result.access_token) {
        throw new DirectusCliError('Login failed: no access token received', 401);
      }

      this.client.setToken(result.access_token);
      return {
        accessToken: result.access_token,
        expires: result.expires ?? undefined,
        refreshToken: result.refresh_token ?? undefined,
      };
    } catch (error) {
      throw DirectusCliError.from(error);
    }
  }

  /**
   * Logout and invalidate the session.
   */
  async logout(): Promise<void> {
    try {
      await this.client.logout();
    } catch (error) {
      throw DirectusCliError.from(error);
    }
  }

  /**
   * Refresh the access token using the stored refresh token.
   *
   * We bypass the Directus SDK's `authentication().refresh()` here because the
   * SDK's composable reads `refresh_token` from its internal storage and
   * silently ignores the one passed via its options argument. Each CLI
   * invocation is a fresh Node process with empty in-memory SDK storage, so
   * in this `authentication('json', ...)` client configuration the SDK refresh
   * request would still be sent in JSON mode but without the persisted
   * `refresh_token`, and the server responds: "The refresh token is required
   * in either the payload or cookie." We therefore POST `/auth/refresh`
   * directly with mode=json + the persisted refresh token.
   */
  async refreshAccessToken(): Promise<undefined | {accessToken: string; expires?: number; refreshToken?: string}> {
    if (!this.refreshToken) {
      return undefined;
    }

    try {
      const refreshUrl = buildRefreshUrl(this.url);
      // eslint-disable-next-line n/no-unsupported-features/node-builtins -- global fetch is available in Node 20+
      const response = await fetch(refreshUrl, {
        // eslint-disable-next-line camelcase -- refresh_token is the Directus API field name
        body: JSON.stringify({mode: 'json', refresh_token: this.refreshToken}),
        headers: {'Content-Type': 'application/json'},
        method: 'POST',
      });

      if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        try {
          const body = (await response.json()) as {errors?: Array<{message?: string}>};
          detail = body?.errors?.[0]?.message ?? detail;
        } catch {
          /* ignore body parse errors */
        }

        throw new DirectusCliError(`Token refresh failed: ${detail}`, response.status);
      }

      const payload = (await response.json()) as {
        data?: {access_token?: string; expires?: number; refresh_token?: string};
      };
      const result = payload?.data ?? (payload as {access_token?: string; expires?: number; refresh_token?: string});

      if (result.access_token) {
        this.client.setToken(result.access_token);
        return {
          accessToken: result.access_token,
          expires: result.expires ?? undefined,
          refreshToken: result.refresh_token ?? undefined,
        };
      }

      return undefined;
    } catch (error) {
      throw DirectusCliError.from(error);
    }
  }

  /**
   * Execute a request with rate limiting and retry logic.
   * On HTTP 401, invokes the configured `onRefresh` callback (if any) and,
   * on a successful refresh, retries the original request exactly once.
   */
  async request<TResult>(command: SdkRestCommand<TResult>): Promise<TResult> {
    const executeRequest = async (attempt: number, refreshAttempted: boolean): Promise<TResult> => {
      if (this.verbose) {
        console.error('[request] Executing SDK command...');
      }

      try {
        // Wrap the SDK request with rate limiting
        // Use bind to preserve 'this' context when calling through limiter
        const boundRequest = this.client.request.bind(this.client) as (cmd: unknown) => Promise<unknown>;
        const result = await limiter.schedule(() => boundRequest(command));
        return result as TResult;
      } catch (error) {
        const directusError = DirectusCliError.from(error);

        // Reactive refresh-on-401: if we have a refresh callback, the token is
        // not a static PAT, and we haven't already tried, refresh and retry once.
        if (
          directusError.statusCode === 401
          && !refreshAttempted
          && this.onRefresh
          && !this.isStaticToken
        ) {
          if (this.verbose) {
            console.error('[auth] 401 received; attempting token refresh...');
          }

          const newToken = await this.onRefresh();
          if (newToken) {
            this.client.setToken(newToken);
            return executeRequest(attempt, true);
          }

          if (this.verbose) {
            console.error('[auth] Refresh was not successful; surfacing 401.');
          }
        }

        // Don't retry on other client errors
        if (directusError.statusCode === 400 || directusError.statusCode === 401) {
          throw directusError;
        }

        // Retry on specific status codes and network errors
        if (this.shouldRetry(directusError) && attempt < MAX_RETRIES) {
          const exponentialBackoff = 2 ** (attempt - 1);
          const delay = RETRY_DELAY_MS * exponentialBackoff;
          if (this.verbose) {
            console.error(`[retry] Attempt ${attempt}/${MAX_RETRIES} after ${delay}ms: ${directusError.message}`);
          }

          await sleep(delay);
          return executeRequest(attempt + 1, refreshAttempted);
        }

        throw directusError;
      }
    };

    return executeRequest(1, false);
  }

  /**
   * Check if a request should be retried based on the error.
   */
  private shouldRetry(error: DirectusCliError): boolean {
    const retryStatusCodes = new Set([429, 503]);
    const retryErrorCodes = new Set(['ECONNREFUSED', 'ETIMEDOUT']);
    return retryStatusCodes.has(error.statusCode ?? 0) || retryErrorCodes.has(error.code ?? '');
  }
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

/**
 * Build the `/auth/refresh` URL relative to a Directus base URL, preserving
 * any subpath configured on the instance (e.g. `https://example.com/directus/`
 * must refresh at `https://example.com/directus/auth/refresh`, not at the
 * host root). Passing a root-absolute path to the URL constructor discards
 * the base pathname, so we resolve a relative segment against a base that is
 * guaranteed to have a trailing slash.
 */
export function buildRefreshUrl(baseUrl: string): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return new URL('auth/refresh', normalizedBase).toString();
}

/**
 * Create a new Directus client instance.
 */
export function createClient(options: ClientOptions): DirectusClient {
  return new DirectusClient(options);
}
