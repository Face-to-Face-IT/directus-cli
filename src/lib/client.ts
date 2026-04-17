import { authentication, type AuthenticationClient, createDirectus, rest, type RestClient } from '@directus/sdk';
import Bottleneck from 'bottleneck';

import { DirectusCliError, type SdkRestCommand } from '../types/index.js';

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
  private refreshToken?: string;
  private url: string;
  private verbose: boolean;

  constructor(options: ClientOptions) {
    this.refreshToken = options.refreshToken;
    this.url = options.url;
    this.verbose = options.verbose ?? false;

    const builder = createDirectus<unknown>(options.url)
      .with(rest())
      .with(authentication('json', { credentials: 'omit' }));

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
  ): Promise<{ accessToken: string; expires?: number; refreshToken?: string }> {
    try {
      const result = await this.client.login({ email, password });
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
   */
  async refreshAccessToken(): Promise<undefined | { accessToken: string; expires?: number; refreshToken?: string }> {
    if (!this.refreshToken) {
      return undefined;
    }

    try {
      const result = await this.client.refresh();
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
   */
  async request<TResult>(command: SdkRestCommand<TResult>): Promise<TResult> {
    const executeRequest = async (attempt: number): Promise<TResult> => {
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

        // Don't retry on client errors
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
          return executeRequest(attempt + 1);
        }

        throw directusError;
      }
    };

    return executeRequest(1);
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
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Create a new Directus client instance.
 */
export function createClient(options: ClientOptions): DirectusClient {
  return new DirectusClient(options);
}
