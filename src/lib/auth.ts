import {createClient} from './client.js';
import {
  loadConfig, type Profile, setProfile, updateProfileTokens,
} from './config.js';

/**
 * Number of seconds before actual expiry at which we consider the access token
 * stale and proactively refresh. Protects long-running commands and agent
 * workflows from a token that is valid at dispatch but expires mid-flight.
 */
export const PROACTIVE_REFRESH_WINDOW_MS = 60 * 1000;

/**
 * Reasons a refresh attempt can fail, exposed to callers for actionable errors.
 */
export type RefreshFailureReason = 'missingProfile' | 'missingRefreshToken' | 'networkError' | 'rejected' | 'unknown';

/**
 * Structured result of a refresh attempt.
 */
export type RefreshResult = {detail?: string; ok: false; reason: RefreshFailureReason} | {ok: true};

/**
 * Resolve connection options from flags, environment variables, and profile config.
 * Priority: flags > env > profile config
 */
export interface ResolvedConnection {
  accessToken?: string;
  expiresAt?: number;
  profileName?: string;
  refreshToken?: string;
  token?: string;
  url: string;
}

/**
 * Resolve connection settings from various sources.
 */
export function resolveConnection(flags: {profile?: string; token?: string; url?: string}): ResolvedConnection {
  // Priority 1: URL and token from flags
  const profileFlag = flags.profile ?? process.env.DIRECTUS_PROFILE;
  const tokenFlag = flags.token ?? process.env.DIRECTUS_TOKEN;
  const urlFlag = flags.url ?? process.env.DIRECTUS_URL;

  if (urlFlag) {
    return {
      profileName: profileFlag,
      token: tokenFlag,
      url: urlFlag,
    };
  }

  // Priority 2: Profile config
  const config = loadConfig();
  const profileName = profileFlag ?? config.defaultProfile;
  const profile = config.profiles[profileName];

  if (!profile) {
    throw new Error(`No profile named "${profileName}" found. Use --url or set a profile with: directus-cli profile add ${profileName} <url>`);
  }

  return {
    accessToken: profile.accessToken,
    expiresAt: profile.expiresAt,
    profileName,
    refreshToken: profile.refreshToken,
    token: profile.token ?? tokenFlag,
    url: profile.url,
  };
}

/**
 * Check if the connection has valid authentication.
 */
export function hasValidAuth(connection: ResolvedConnection): boolean {
  if (connection.token) {
    return true;
  }

  if (connection.accessToken) {
    // Check if token is expired
    if (connection.expiresAt && Date.now() >= connection.expiresAt) {
      return Boolean(connection.refreshToken);
    }

    return true;
  }

  return false;
}

/**
 * Check if the access token is expired or within the proactive refresh window.
 */
export function isTokenExpired(connection: ResolvedConnection, windowMs = PROACTIVE_REFRESH_WINDOW_MS): boolean {
  if (!connection.accessToken || !connection.expiresAt) {
    return false;
  }

  return Date.now() + windowMs >= connection.expiresAt;
}

/**
 * Login and store tokens in the profile.
 */
export async function loginAndStoreTokens(
  profileName: string,
  email: string,
  password: string,
  url?: string,
): Promise<void> {
  const connectionUrl = url ?? loadConfig().profiles[profileName]?.url;

  if (!connectionUrl) {
    throw new Error(`Profile "${profileName}" not found. Create it first with: directus-cli profile add ${profileName} <url>`);
  }

  const client = createClient({url: connectionUrl});
  try {
    const tokens = await client.login(email, password);

    if (!tokens.expires) {
      throw new Error('Login response did not include expiration');
    }

    const expiresMs = tokens.expires * 1000;
    updateProfileTokens(profileName, {
      accessToken: tokens.accessToken,
      expiresAt: Date.now() + expiresMs,
      refreshToken: tokens.refreshToken,
    });
  } finally {
    await client.destroy();
  }
}

/**
 * Logout and clear stored tokens from profile.
 */
export async function logoutAndClearTokens(profileName: string): Promise<void> {
  const config = loadConfig();
  const profile = config.profiles[profileName];

  if (!profile) {
    throw new Error(`Profile "${profileName}" not found`);
  }

  // Try to logout via API if we have tokens
  if (profile.accessToken) {
    const client = createClient({
      accessToken: profile.accessToken,
      url: profile.url,
    });
    try {
      await client.logout();
    } catch {
      // Ignore logout errors
    }
    // Do not call client.destroy(): the Bottleneck limiter is module-scoped
    // and shared across clients; disconnecting it here would break any
    // concurrent in-flight requests.
  }

  // Clear tokens from profile
  const updatedProfile: Profile = {
    token: profile.token,
    url: profile.url,
  };
  setProfile(profileName, updatedProfile);
}

/**
 * Refresh the access token for a profile and update stored tokens.
 * Returns `true` on success, `false` on any failure (backwards compatible).
 * For structured error information, prefer {@link refreshAndStoreTokensDetailed}.
 */
export async function refreshAndStoreTokens(profileName: string): Promise<boolean> {
  const result = await refreshAndStoreTokensDetailed(profileName);
  return result.ok;
}

/**
 * Refresh the access token for a profile and return a structured result
 * describing why refresh failed (if it did).
 */
export async function refreshAndStoreTokensDetailed(profileName: string): Promise<RefreshResult> {
  const config = loadConfig();
  const profile = config.profiles[profileName];

  if (!profile) {
    return {ok: false, reason: 'missingProfile'};
  }

  if (!profile.refreshToken) {
    return {ok: false, reason: 'missingRefreshToken'};
  }

  const client = createClient({
    accessToken: profile.accessToken,
    refreshToken: profile.refreshToken,
    url: profile.url,
  });

  try {
    const tokens = await client.refreshAccessToken();

    if (!tokens || !tokens.expires) {
      return {
        detail: 'Refresh response did not include a new access token or expiry.',
        ok: false,
        reason: 'rejected',
      };
    }

    const expiresMs = tokens.expires * 1000;
    updateProfileTokens(profileName, {
      accessToken: tokens.accessToken,
      expiresAt: Date.now() + expiresMs,
      refreshToken: tokens.refreshToken ?? profile.refreshToken,
    });

    return {ok: true};
  } catch (error) {
    return classifyRefreshError(error);
  }

  // Intentionally do NOT call client.destroy() here. The Bottleneck limiter in
  // client.ts is module-scoped and shared across all DirectusClient instances.
  // Destroying it would disconnect the limiter mid-flight when this helper is
  // invoked from an outer client's `onRefresh` callback, breaking subsequent
  // `limiter.schedule(...)` calls on the in-flight request. The limiter has no
  // per-instance state to clean up, so leaking this client is safe.
}

/**
 * Classify a refresh error into a structured {@link RefreshResult}.
 */
function classifyRefreshError(error: unknown): RefreshResult {
  const err = error as {code?: string; message?: string; statusCode?: number};
  const networkCodes = new Set(['EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT']);

  if (err.code && networkCodes.has(err.code)) {
    return {detail: err.message ?? err.code, ok: false, reason: 'networkError'};
  }

  if (err.statusCode === 401 || err.statusCode === 403) {
    return {
      detail: err.message ?? 'Refresh token was rejected by the server (expired or revoked).',
      ok: false,
      reason: 'rejected',
    };
  }

  return {detail: err.message, ok: false, reason: 'unknown'};
}
