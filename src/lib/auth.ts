import {createClient} from './client.js';
import {
  loadConfig, type Profile, setProfile, updateProfileTokens,
} from './config.js';

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
 * Check if the access token is expired.
 */
export function isTokenExpired(connection: ResolvedConnection): boolean {
  if (!connection.accessToken || !connection.expiresAt) {
    return false;
  }

  return Date.now() >= connection.expiresAt;
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
  const tokens = await client.login(email, password);

  if (!tokens.expires) {
    throw new Error('Login response did not include expiration');
  }

  updateProfileTokens(profileName, {
    accessToken: tokens.accessToken,
    expiresAt: Date.now() + (tokens.expires * 1000),
    refreshToken: tokens.refreshToken ?? '',
  });
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
    try {
      const client = createClient({
        accessToken: profile.accessToken,
        url: profile.url,
      });
      await client.logout();
    } catch {
      // Ignore logout errors
    }
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
 */
export async function refreshAndStoreTokens(profileName: string): Promise<boolean> {
  const config = loadConfig();
  const profile = config.profiles[profileName];

  if (!profile || !profile.refreshToken) {
    return false;
  }

  try {
    const client = createClient({
      accessToken: profile.accessToken,
      refreshToken: profile.refreshToken,
      url: profile.url,
    });

    const tokens = await client.refreshAccessToken();

    if (!tokens) {
      return false;
    }

    if (!tokens.expires) {
      return false;
    }

    updateProfileTokens(profileName, {
      accessToken: tokens.accessToken,
      expiresAt: Date.now() + (tokens.expires * 1000),
      refreshToken: tokens.refreshToken ?? profile.refreshToken,
    });

    return true;
  } catch {
    return false;
  }
}
