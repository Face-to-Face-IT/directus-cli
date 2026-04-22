import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';

import {
  isTokenExpired,
  PROACTIVE_REFRESH_WINDOW_MS,
  refreshAndStoreTokensDetailed,
  type ResolvedConnection,
} from '../../src/lib/auth.js';

vi.mock('node:fs');
vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return {...actual, platform: vi.fn(() => 'linux')};
});

const mockRefreshAccessToken = vi.fn();
const mockDestroy = vi.fn();

vi.mock('../../src/lib/client.js', () => ({
  createClient: vi.fn(() => ({
    destroy: mockDestroy,
    refreshAccessToken: mockRefreshAccessToken,
  })),
}));

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);

function setConfig(profiles: Record<string, unknown>): void {
  mockExistsSync.mockReturnValue(true);
  mockReadFileSync.mockReturnValue(JSON.stringify({defaultProfile: 'default', profiles}));
}

describe('auth', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockDestroy.mockResolvedValue();
  });

  describe('isTokenExpired', () => {
    it('returns false when no accessToken or expiresAt', () => {
      const conn: ResolvedConnection = {url: 'https://x'};
      expect(isTokenExpired(conn)).toBe(false);
    });

    it('returns false when token expires well beyond the proactive window', () => {
      const conn: ResolvedConnection = {
        accessToken: 'a',
        expiresAt: Date.now() + PROACTIVE_REFRESH_WINDOW_MS + 60_000,
        url: 'https://x',
      };
      expect(isTokenExpired(conn)).toBe(false);
    });

    it('returns true when token is within the proactive window but not yet expired', () => {
      const conn: ResolvedConnection = {
        accessToken: 'a',
        expiresAt: Date.now() + 10_000,
        url: 'https://x',
      };
      expect(isTokenExpired(conn)).toBe(true);
    });

    it('returns true when token is already expired', () => {
      const conn: ResolvedConnection = {
        accessToken: 'a',
        expiresAt: Date.now() - 1000,
        url: 'https://x',
      };
      expect(isTokenExpired(conn)).toBe(true);
    });

    it('honours custom window of 0 for strict expiry check', () => {
      const conn: ResolvedConnection = {
        accessToken: 'a',
        expiresAt: Date.now() + 10_000,
        url: 'https://x',
      };
      expect(isTokenExpired(conn, 0)).toBe(false);
    });
  });

  describe('refreshAndStoreTokensDetailed', () => {
    it('returns missingProfile when profile does not exist', async () => {
      setConfig({});

      const result = await refreshAndStoreTokensDetailed('missing');

      expect(result).toEqual({ok: false, reason: 'missingProfile'});
      expect(mockRefreshAccessToken).not.toHaveBeenCalled();
    });

    it('returns missingRefreshToken when profile has no refresh token', async () => {
      setConfig({dev: {url: 'https://dev.example.com'}});

      const result = await refreshAndStoreTokensDetailed('dev');

      expect(result).toEqual({ok: false, reason: 'missingRefreshToken'});
      expect(mockRefreshAccessToken).not.toHaveBeenCalled();
    });

    it('returns ok on successful refresh and persists tokens', async () => {
      setConfig({
        dev: {
          accessToken: 'old-access',
          expiresAt: 1000,
          refreshToken: 'old-refresh',
          url: 'https://dev.example.com',
        },
      });
      mockRefreshAccessToken.mockResolvedValue({
        accessToken: 'new-access',
        expires: 900,
        refreshToken: 'new-refresh',
      });

      const result = await refreshAndStoreTokensDetailed('dev');

      expect(result).toEqual({ok: true});
      expect(mockWriteFileSync).toHaveBeenCalled();
      const written = JSON.parse(mockWriteFileSync.mock.calls[0]![1] as string);
      expect(written.profiles.dev.accessToken).toBe('new-access');
      expect(written.profiles.dev.refreshToken).toBe('new-refresh');
    });

    it('preserves old refresh token when API does not return a new one', async () => {
      setConfig({
        dev: {
          accessToken: 'old-access',
          expiresAt: 1000,
          refreshToken: 'old-refresh',
          url: 'https://dev.example.com',
        },
      });
      mockRefreshAccessToken.mockResolvedValue({
        accessToken: 'new-access',
        expires: 900,
      });

      const result = await refreshAndStoreTokensDetailed('dev');

      expect(result.ok).toBe(true);
      const written = JSON.parse(mockWriteFileSync.mock.calls[0]![1] as string);
      expect(written.profiles.dev.refreshToken).toBe('old-refresh');
    });

    it('returns rejected when refresh response is missing fields', async () => {
      setConfig({
        dev: {refreshToken: 'r', url: 'https://dev.example.com'},
      });
      mockRefreshAccessToken.mockResolvedValue(null);

      const result = await refreshAndStoreTokensDetailed('dev');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('rejected');
      }
    });

    it('classifies network errors', async () => {
      setConfig({
        dev: {refreshToken: 'r', url: 'https://dev.example.com'},
      });
      const err = Object.assign(new Error('connect ECONNREFUSED'), {code: 'ECONNREFUSED'});
      mockRefreshAccessToken.mockRejectedValue(err);

      const result = await refreshAndStoreTokensDetailed('dev');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('networkError');
      }
    });

    it('classifies 401 as rejected', async () => {
      setConfig({
        dev: {refreshToken: 'r', url: 'https://dev.example.com'},
      });
      const err = Object.assign(new Error('Unauthorized'), {statusCode: 401});
      mockRefreshAccessToken.mockRejectedValue(err);

      const result = await refreshAndStoreTokensDetailed('dev');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('rejected');
      }
    });

    it('classifies 403 as rejected', async () => {
      setConfig({
        dev: {refreshToken: 'r', url: 'https://dev.example.com'},
      });
      const err = Object.assign(new Error('Forbidden'), {statusCode: 403});
      mockRefreshAccessToken.mockRejectedValue(err);

      const result = await refreshAndStoreTokensDetailed('dev');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('rejected');
      }
    });

    it('falls back to unknown for unclassified errors', async () => {
      setConfig({
        dev: {refreshToken: 'r', url: 'https://dev.example.com'},
      });
      mockRefreshAccessToken.mockRejectedValue(new Error('weird'));

      const result = await refreshAndStoreTokensDetailed('dev');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('unknown');
      }
    });
  });
});
