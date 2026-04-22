import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';

import type {DirectusClient} from '../../src/lib/client.js';

import {
  describeRegistryExtension,
  installRegistryExtension,
  parseVersionedIdentifier,
  pickLatestVersion,
  reinstallRegistryExtension,
  resolveInstalledExtension,
  resolveRegistryExtension,
  searchRegistry,
  uninstallRegistryExtension,
  unwrap,
} from '../../src/lib/extensions-registry.js';

const mockRequest = vi.fn();
const mockClient = {request: mockRequest} as unknown as DirectusClient;

describe('extensions-registry', () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  describe('searchRegistry', () => {
    it('builds a GET command with encoded query params', () => {
      const cmd = searchRegistry({
        limit: 10, offset: 5, sandbox: true, search: 'computed', type: 'interface',
      });
      expect(cmd.method).toBe('GET');
      expect(cmd.path).toContain('/extensions/registry?');
      expect(cmd.path).toContain('search=computed');
      expect(cmd.path).toContain('limit=10');
      expect(cmd.path).toContain('offset=5');
      expect(cmd.path).toContain('type=interface');
      expect(cmd.path).toContain('sandbox=true');
    });

    it('omits the querystring when no params are provided', () => {
      const cmd = searchRegistry({});
      expect(cmd.path).toBe('/extensions/registry');
    });
  });

  describe('describeRegistryExtension', () => {
    it('URL-encodes the extension id', () => {
      const cmd = describeRegistryExtension('abc 123');
      expect(cmd.method).toBe('GET');
      expect(cmd.path).toBe('/extensions/registry/extension/abc%20123');
    });
  });

  describe('installRegistryExtension', () => {
    it('POSTs a JSON body with extension and version', () => {
      const cmd = installRegistryExtension('uuid-123', '1.2.3');
      expect(cmd.method).toBe('POST');
      expect(cmd.path).toBe('/extensions/registry/install');
      expect(JSON.parse(cmd.body as string)).toEqual({extension: 'uuid-123', version: '1.2.3'});
    });
  });

  describe('uninstallRegistryExtension', () => {
    it('builds a DELETE with the encoded pk', () => {
      const cmd = uninstallRegistryExtension('pk-1');
      expect(cmd.method).toBe('DELETE');
      expect(cmd.path).toBe('/extensions/registry/uninstall/pk-1');
    });
  });

  describe('reinstallRegistryExtension', () => {
    it('POSTs a JSON body with the extension id', () => {
      const cmd = reinstallRegistryExtension('uuid-456');
      expect(cmd.method).toBe('POST');
      expect(cmd.path).toBe('/extensions/registry/reinstall');
      expect(JSON.parse(cmd.body as string)).toEqual({extension: 'uuid-456'});
    });
  });

  describe('unwrap', () => {
    it('returns the array unchanged', () => {
      expect(unwrap([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('unwraps an envelope', () => {
      expect(unwrap({data: [1, 2]})).toEqual([1, 2]);
    });

    it('returns an empty array when data is missing', () => {
      expect(unwrap({})).toEqual([]);
    });
  });

  describe('parseVersionedIdentifier', () => {
    it('splits name@version', () => {
      expect(parseVersionedIdentifier('foo@1.2.3')).toEqual({identifier: 'foo', version: '1.2.3'});
    });

    it('returns just identifier when no @ is present', () => {
      expect(parseVersionedIdentifier('foo')).toEqual({identifier: 'foo'});
    });

    it('supports @latest', () => {
      expect(parseVersionedIdentifier('foo@latest')).toEqual({identifier: 'foo', version: 'latest'});
    });

    it('handles a trailing empty version as undefined', () => {
      expect(parseVersionedIdentifier('foo@')).toEqual({identifier: 'foo'});
    });
  });

  describe('pickLatestVersion', () => {
    it('returns the first stable version', () => {
      expect(pickLatestVersion([
        {version: '2.0.0-beta.1'},
        {version: '1.5.0'},
        {version: '1.4.0'},
      ])).toBe('1.5.0');
    });

    it('skips unsafe versions', () => {
      expect(pickLatestVersion([
        {unsafe: true, version: '2.0.0'},
        {version: '1.0.0'},
      ])).toBe('1.0.0');
    });

    it('falls back to first when all are prereleases', () => {
      expect(pickLatestVersion([{version: '1.0.0-alpha'}, {version: '0.9.0-rc'}])).toBe('1.0.0-alpha');
    });

    it('skips unsafe entries even when they appear before stable ones in the list', () => {
      expect(pickLatestVersion([
        {unsafe: true, version: '3.0.0'},
        {unsafe: true, version: '2.0.0-beta'},
        {version: '1.5.0-rc'},
        {version: '1.4.0'},
      ])).toBe('1.4.0');
    });

    it('returns the first safe prerelease when no safe stable version exists', () => {
      expect(pickLatestVersion([
        {unsafe: true, version: '2.0.0'},
        {version: '1.0.0-beta.2'},
        {version: '1.0.0-beta.1'},
      ])).toBe('1.0.0-beta.2');
    });

    it('throws when every version is unsafe', () => {
      expect(() => pickLatestVersion([
        {unsafe: true, version: '2.0.0'},
        {unsafe: true, version: '1.0.0'},
      ])).toThrow(/no safe published versions/i);
    });

    it('throws when no versions are available', () => {
      expect(() => pickLatestVersion([])).toThrow(/no published versions/i);
      expect(() => pickLatestVersion()).toThrow(/no published versions/i);
    });
  });

  describe('resolveRegistryExtension', () => {
    it('fetches by UUID directly when the identifier is a UUID', async () => {
      const uuid = '12345678-1234-1234-1234-123456789abc';
      mockRequest.mockResolvedValueOnce({data: {id: uuid, name: 'some-ext'}});

      const result = await resolveRegistryExtension(mockClient, uuid);

      expect(result.id).toBe(uuid);
      const cmd = mockRequest.mock.calls[0]![0];
      expect(cmd.path).toBe(`/extensions/registry/extension/${uuid}`);
    });

    it('searches by name and returns an exact match', async () => {
      mockRequest.mockResolvedValueOnce({
        data: [
          {id: 'a', name: 'directus-extension-foo'},
          {id: 'b', name: 'directus-extension-foo-bar'},
        ],
      });

      const result = await resolveRegistryExtension(mockClient, 'directus-extension-foo');

      expect(result.id).toBe('a');
    });

    it('returns the sole match when there is only one', async () => {
      mockRequest.mockResolvedValueOnce({data: [{id: 'x', name: 'something-else'}]});

      const result = await resolveRegistryExtension(mockClient, 'foo');

      expect(result.id).toBe('x');
    });

    it('throws when no matches are found', async () => {
      mockRequest.mockResolvedValueOnce({data: []});

      await expect(resolveRegistryExtension(mockClient, 'missing')).rejects.toThrow(/No registry extension matches/);
    });

    it('throws on ambiguous name when no exact match', async () => {
      mockRequest.mockResolvedValueOnce({
        data: [
          {id: 'a', name: 'foo-1'},
          {id: 'b', name: 'foo-2'},
        ],
      });

      await expect(resolveRegistryExtension(mockClient, 'foo')).rejects.toThrow(/Ambiguous extension name/);
    });
  });

  describe('resolveInstalledExtension', () => {
    it('matches by installed row pk when a UUID is given', async () => {
      const pk = '12345678-1234-1234-1234-123456789abc';
      mockRequest.mockResolvedValueOnce([
        {meta: {id: pk, source: 'registry'}, name: 'foo'},
      ]);

      const result = await resolveInstalledExtension(mockClient, pk);

      expect(result.name).toBe('foo');
    });

    it('matches by name when a name is given', async () => {
      mockRequest.mockResolvedValueOnce({
        data: [
          {meta: {id: 'pk-a', source: 'registry'}, name: 'bar'},
          {meta: {id: 'pk-b', source: 'registry'}, name: 'foo'},
        ],
      });

      const result = await resolveInstalledExtension(mockClient, 'foo');

      expect(result.meta?.id).toBe('pk-b');
    });

    it('throws when the name appears multiple times', async () => {
      mockRequest.mockResolvedValueOnce([
        {meta: {id: 'pk-a', source: 'registry'}, name: 'foo'},
        {meta: {id: 'pk-b', source: 'registry'}, name: 'foo'},
      ]);

      await expect(resolveInstalledExtension(mockClient, 'foo')).rejects.toThrow(/Multiple installed extensions/);
    });

    it('throws when no match is found', async () => {
      mockRequest.mockResolvedValueOnce([]);

      await expect(resolveInstalledExtension(mockClient, 'nope')).rejects.toThrow(/No installed extension matches/);
    });
  });
});
