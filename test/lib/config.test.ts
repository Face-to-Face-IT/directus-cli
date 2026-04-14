import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import {
  getProfile,
  loadConfig,
  removeProfile,
  saveConfig,
  setDefaultProfile,
  setProfile,
} from '../../src/lib/config.js';

vi.mock('node:fs');

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);

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
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          defaultProfile: 'dev',
          profiles: {
            dev: { url: 'https://dev.example.com' },
          },
        }),
      );

      const config = loadConfig();

      expect(config.defaultProfile).toBe('dev');
      expect(config.profiles.dev).toEqual({ url: 'https://dev.example.com' });
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

  describe('getProfile', () => {
    it('returns undefined for non-existent profile', () => {
      mockExistsSync.mockReturnValue(false);

      const result = getProfile('missing');

      expect(result).toBeUndefined();
    });

    it('returns profile by name', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          defaultProfile: 'default',
          profiles: {
            dev: { token: 'test-token', url: 'https://dev.example.com' },
          },
        }),
      );

      const result = getProfile('dev');

      expect(result).toEqual({
        name: 'dev',
        profile: { token: 'test-token', url: 'https://dev.example.com' },
      });
    });
  });
});
