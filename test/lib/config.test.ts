import {
  chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync,
} from 'node:fs';
import {platform} from 'node:os';
import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';

import {
  getProfile,
  loadConfig,
  removeProfile,
  saveConfig,
  setDefaultProfile,
  setProfile,
  updateProfileTokens,
} from '../../src/lib/config.js';

vi.mock('node:fs');
vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return {...actual, platform: vi.fn(() => 'linux')};
});

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);
const mockChmodSync = vi.mocked(chmodSync);
const mockPlatform = vi.mocked(platform);

describe('config', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('loadConfig', () => {
    it('returns default config when file does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      const config = loadConfig();

      expect(config.defaultProfile).toBe('default');
      expect(config.profiles).toEqual({});
    });

    it('parses existing config file', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        defaultProfile: 'dev',
        profiles: {
          dev: {url: 'https://dev.example.com'},
        },
      }));

      const config = loadConfig();

      expect(config.defaultProfile).toBe('dev');
      expect(config.profiles.dev).toEqual({url: 'https://dev.example.com'});
    });

    it('returns default config when file is invalid', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => {
        throw new SyntaxError('Unexpected token');
      });

      const config = loadConfig();

      expect(config.defaultProfile).toBe('default');
      expect(config.profiles).toEqual({});
    });
  });

  describe('saveConfig', () => {
    it('chmods config to 0600 on POSIX systems', () => {
      mockExistsSync.mockReturnValue(true);
      mockPlatform.mockReturnValue('linux');

      saveConfig({defaultProfile: 'default', profiles: {}});

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      expect(mockChmodSync).toHaveBeenCalledTimes(1);
      expect(mockChmodSync.mock.calls[0]![1]).toBe(0o600);
    });

    it('does not chmod on Windows', () => {
      mockExistsSync.mockReturnValue(true);
      mockPlatform.mockReturnValue('win32');

      saveConfig({defaultProfile: 'default', profiles: {}});

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      expect(mockChmodSync).not.toHaveBeenCalled();
    });

    it('creates config dir with 0700 mode when missing', () => {
      mockExistsSync.mockReturnValue(false);
      mockPlatform.mockReturnValue('linux');

      saveConfig({defaultProfile: 'default', profiles: {}});

      expect(mockMkdirSync).toHaveBeenCalledTimes(1);
      const opts = mockMkdirSync.mock.calls[0]![1] as {mode: number; recursive: boolean};
      expect(opts.mode).toBe(0o700);
      expect(opts.recursive).toBe(true);
    });

    it('swallows chmod errors silently', () => {
      mockExistsSync.mockReturnValue(true);
      mockPlatform.mockReturnValue('linux');
      mockChmodSync.mockImplementation(() => {
        throw new Error('EPERM');
      });

      expect(() => saveConfig({defaultProfile: 'default', profiles: {}})).not.toThrow();
    });
  });

  describe('updateProfileTokens', () => {
    const existingConfig = {
      defaultProfile: 'default',
      profiles: {
        dev: {
          accessToken: 'old-access',
          expiresAt: 1000,
          refreshToken: 'old-refresh',
          url: 'https://dev.example.com',
        },
      },
    };

    function getWrittenConfig(): typeof existingConfig {
      const raw = mockWriteFileSync.mock.calls[0]![1] as string;
      return JSON.parse(raw);
    }

    beforeEach(() => {
      mockExistsSync.mockReturnValue(true);
      mockPlatform.mockReturnValue('linux');
      mockReadFileSync.mockReturnValue(JSON.stringify(existingConfig));
    });

    it('preserves existing refreshToken when refreshToken key is omitted', () => {
      updateProfileTokens('dev', {accessToken: 'new-access', expiresAt: 2000});

      const written = getWrittenConfig();
      expect(written.profiles.dev.accessToken).toBe('new-access');
      expect(written.profiles.dev.expiresAt).toBe(2000);
      expect(written.profiles.dev.refreshToken).toBe('old-refresh');
    });

    it('updates refreshToken when a new value is provided', () => {
      updateProfileTokens('dev', {
        accessToken: 'new-access',
        expiresAt: 2000,
        refreshToken: 'new-refresh',
      });

      const written = getWrittenConfig();
      expect(written.profiles.dev.refreshToken).toBe('new-refresh');
    });

    it('deletes refreshToken when explicit empty string is provided', () => {
      updateProfileTokens('dev', {
        accessToken: 'new-access',
        expiresAt: 2000,
        refreshToken: '',
      });

      const written = getWrittenConfig();
      expect(written.profiles.dev.refreshToken).toBeUndefined();
    });

    it('no-ops when profile does not exist', () => {
      updateProfileTokens('missing', {accessToken: 'x', expiresAt: 1});
      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });
  });

  describe('setDefaultProfile', () => {
    it('updates defaultProfile and saves', () => {
      mockExistsSync.mockReturnValue(true);
      mockPlatform.mockReturnValue('linux');
      mockReadFileSync.mockReturnValue(JSON.stringify({defaultProfile: 'default', profiles: {dev: {url: 'x'}}}));

      setDefaultProfile('dev');

      const raw = mockWriteFileSync.mock.calls[0]![1] as string;
      expect(JSON.parse(raw).defaultProfile).toBe('dev');
    });
  });

  describe('setProfile / removeProfile', () => {
    it('adds a new profile', () => {
      mockExistsSync.mockReturnValue(true);
      mockPlatform.mockReturnValue('linux');
      mockReadFileSync.mockReturnValue(JSON.stringify({defaultProfile: 'default', profiles: {}}));

      setProfile('prod', {url: 'https://prod.example.com'});

      const raw = mockWriteFileSync.mock.calls[0]![1] as string;
      expect(JSON.parse(raw).profiles.prod).toEqual({url: 'https://prod.example.com'});
    });

    it('removes a profile and resets defaultProfile when removing the default', () => {
      mockExistsSync.mockReturnValue(true);
      mockPlatform.mockReturnValue('linux');
      mockReadFileSync.mockReturnValue(JSON.stringify({
        defaultProfile: 'dev',
        profiles: {
          dev: {url: 'https://dev.example.com'},
          prod: {url: 'https://prod.example.com'},
        },
      }));

      const result = removeProfile('dev');

      expect(result).toBe(true);
      const written = JSON.parse(mockWriteFileSync.mock.calls[0]![1] as string);
      expect(written.profiles.dev).toBeUndefined();
      expect(written.defaultProfile).toBe('prod');
    });

    it('returns false when removing non-existent profile', () => {
      mockExistsSync.mockReturnValue(true);
      mockPlatform.mockReturnValue('linux');
      mockReadFileSync.mockReturnValue(JSON.stringify({defaultProfile: 'default', profiles: {}}));

      const result = removeProfile('missing');

      expect(result).toBe(false);
      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('returns undefined for non-existent profile', () => {
      mockExistsSync.mockReturnValue(false);

      const result = getProfile('missing');

      expect(result).toBeUndefined();
    });

    it('returns profile by name', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        defaultProfile: 'default',
        profiles: {
          dev: {token: 'test-token', url: 'https://dev.example.com'},
        },
      }));

      const result = getProfile('dev');

      expect(result).toEqual({
        name: 'dev',
        profile: {token: 'test-token', url: 'https://dev.example.com'},
      });
    });
  });
});
