import {
  chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync,
} from 'node:fs';
import {homedir, platform} from 'node:os';
import {dirname, join} from 'node:path';

/**
 * Configuration for a single Directus instance profile.
 */
export interface Profile {
  accessToken?: string;
  expiresAt?: number;
  refreshToken?: string;
  token?: string;
  url: string;
}

/**
 * Root config structure persisted to disk.
 */
export interface Config {
  defaultProfile: string;
  profiles: Record<string, Profile>;
}

const DEFAULT_CONFIG: Config = {
  defaultProfile: 'default',
  profiles: {},
};

/**
 * Resolve the config directory path following XDG conventions.
 */
function getConfigDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg ?? join(homedir(), '.config');
  return join(base, 'directus-cli');
}

/**
 * Resolve the full path to the config file.
 */
function getConfigPath(): string {
  return join(getConfigDir(), 'config.json');
}

/**
 * Load the config from disk, creating a default if it doesn't exist.
 */
export function loadConfig(): Config {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    return {...DEFAULT_CONFIG, profiles: {}};
  }

  try {
    const raw = readFileSync(configPath, 'utf8');
    const parsed: unknown = JSON.parse(raw);

    if (!isConfig(parsed)) {
      return {...DEFAULT_CONFIG, profiles: {}};
    }

    return parsed;
  } catch {
    return {...DEFAULT_CONFIG, profiles: {}};
  }
}

/**
 * Save the config to disk with owner-only permissions (0600) on POSIX systems.
 * The config file may contain access and refresh tokens.
 */
export function saveConfig(config: Config): void {
  const configPath = getConfigPath();
  const dir = dirname(configPath);

  if (!existsSync(dir)) {
    mkdirSync(dir, {mode: 0o700, recursive: true});
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');

  // Tighten file permissions on POSIX. No-op on Windows.
  if (platform() !== 'win32') {
    try {
      chmodSync(configPath, 0o600);
    } catch {
      // If chmod fails, proceed silently — the file is still written.
    }
  }
}

/**
 * Get a profile by name, falling back to the default profile.
 */
export function getProfile(name?: string): undefined | {name: string; profile: Profile} {
  const config = loadConfig();
  const profileName = name ?? config.defaultProfile;
  const profile = config.profiles[profileName];

  if (!profile) {
    return undefined;
  }

  return {name: profileName, profile};
}

/**
 * Set or update a profile.
 */
export function setProfile(name: string, profile: Profile): void {
  const config = loadConfig();
  config.profiles[name] = profile;
  saveConfig(config);
}

/**
 * Remove a profile by name.
 */
export function removeProfile(name: string): boolean {
  const config = loadConfig();

  if (!(name in config.profiles)) {
    return false;
  }

  delete config.profiles[name];

  if (config.defaultProfile === name) {
    const remaining = Object.keys(config.profiles);
    config.defaultProfile = remaining[0] ?? 'default';
  }

  saveConfig(config);
  return true;
}

/**
 * Set the default profile.
 */
export function setDefaultProfile(name: string): void {
  const config = loadConfig();
  config.defaultProfile = name;
  saveConfig(config);
}

/**
 * Update stored auth tokens for a profile.
 * `refreshToken` is optional; pass `undefined` to clear the stored refresh token,
 * or omit it to leave the existing refresh token in place.
 */
export function updateProfileTokens(
  name: string,
  tokens: {accessToken: string; expiresAt: number; refreshToken?: string},
): void {
  const config = loadConfig();
  const profile = config.profiles[name];

  if (!profile) {
    return;
  }

  profile.accessToken = tokens.accessToken;
  profile.expiresAt = tokens.expiresAt;
  if ('refreshToken' in tokens) {
    if (tokens.refreshToken) {
      profile.refreshToken = tokens.refreshToken;
    } else {
      delete profile.refreshToken;
    }
  }

  saveConfig(config);
}

/**
 * Type guard for the Config shape.
 */
function isConfig(value: unknown): value is Config {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.defaultProfile === 'string' && typeof obj.profiles === 'object' && obj.profiles !== null;
}
