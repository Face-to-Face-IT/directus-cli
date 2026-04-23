import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';

import {createClient} from '../../src/lib/client.js';

// Mock @directus/sdk so createClient() doesn't try to build a real client
vi.mock('@directus/sdk', () => {
  const mockClient = {
    login: vi.fn(),
    refresh: vi.fn(),
    request: vi.fn(),
    setToken: vi.fn(),
  };
  const authentication = vi.fn(() => (c: unknown) => c);
  const rest = vi.fn(() => (c: unknown) => c);
  const createDirectus = vi.fn(() => ({
    with: vi.fn().mockReturnValue({
      ...mockClient,
      with: vi.fn().mockReturnValue(mockClient),
    }),
  }));
  return {authentication, createDirectus, rest};
});

describe('DirectusClient.refreshAccessToken', () => {
  const originalFetch = globalThis.fetch;
  const mockFetch = vi.fn();

  beforeEach(() => {
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns undefined when no refresh token is configured', async () => {
    const client = createClient({url: 'https://example.test'});
    const result = await client.refreshAccessToken();
    expect(result).toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('POSTs /auth/refresh with mode=json and the stored refresh_token', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        data: {access_token: 'new-access', expires: 900_000, refresh_token: 'new-refresh'},
      }),
      ok: true,
      status: 200,
    });

    const client = createClient({refreshToken: 'stored-refresh', url: 'https://example.test'});
    const result = await client.refreshAccessToken();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0]!;
    expect(url).toBe('https://example.test/auth/refresh');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({'Content-Type': 'application/json'});
    expect(JSON.parse(init.body as string)).toEqual({
      mode: 'json',
      refresh_token: 'stored-refresh',
    });

    expect(result).toEqual({
      accessToken: 'new-access',
      expires: 900_000,
      refreshToken: 'new-refresh',
    });
  });

  it('throws DirectusCliError with server detail on non-OK response', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({errors: [{message: 'Invalid refresh token.'}]}),
      ok: false,
      status: 401,
    });

    const client = createClient({refreshToken: 'bad', url: 'https://example.test'});
    await expect(client.refreshAccessToken()).rejects.toThrow(/Invalid refresh token\./);
  });

  it('propagates HTTP status detail when response body is not JSON', async () => {
    mockFetch.mockResolvedValue({
      json: async () => {
        throw new Error('not json');
      },
      ok: false,
      status: 500,
    });

    const client = createClient({refreshToken: 'x', url: 'https://example.test'});
    await expect(client.refreshAccessToken()).rejects.toThrow(/HTTP 500/);
  });

  it('returns undefined if response omits access_token', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({data: {}}),
      ok: true,
      status: 200,
    });

    const client = createClient({refreshToken: 'x', url: 'https://example.test'});
    const result = await client.refreshAccessToken();
    expect(result).toBeUndefined();
  });

  it('POSTs to the refresh endpoint relative to a base URL pathname', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        data: {access_token: 'new-access', expires: 900_000, refresh_token: 'new-refresh'},
      }),
      ok: true,
      status: 200,
    });

    const client = createClient({
      refreshToken: 'stored-refresh',
      url: 'https://example.test/directus/',
    });

    await client.refreshAccessToken();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0]!;
    expect(url).toBe('https://example.test/directus/auth/refresh');
  });

  it('preserves the base pathname even when the URL is missing a trailing slash', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        data: {access_token: 'new-access', expires: 900_000, refresh_token: 'new-refresh'},
      }),
      ok: true,
      status: 200,
    });

    const client = createClient({
      refreshToken: 'stored-refresh',
      url: 'https://example.test/directus',
    });

    await client.refreshAccessToken();

    const [url] = mockFetch.mock.calls[0]!;
    expect(url).toBe('https://example.test/directus/auth/refresh');
  });
});
