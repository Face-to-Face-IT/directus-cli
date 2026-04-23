import type {DirectusClient} from './client.js';

import {type SdkRestCommand} from '../types/index.js';

/**
 * Shape of a single extension entry returned by the registry search endpoint.
 * Only fields actually consumed by the CLI are typed here.
 */
export interface RegistryExtension {
  description?: null | string;
  downloads?: number;
  host?: null | string;
  id: string;
  last_updated?: null | string;
  license?: null | string;
  name: string;
  publisher?: null | string;
  readme?: null | string;
  sandbox?: boolean;
  total_downloads?: number;
  type?: string;
  versions?: RegistryExtensionVersion[];
}

/**
 * A single version entry returned by the registry describe endpoint.
 */
export interface RegistryExtensionVersion {
  host_version?: null | string;
  publish_date?: null | string;
  type?: string;
  unsafe?: boolean;
  url?: null | string;
  verified?: boolean;
  version: string;
}

/**
 * A row from `GET /extensions/` (installed extensions).
 *
 * The Directus API does not return a top-level `name` field for installed
 * extensions — the extension name lives under `schema.name`. The top-level
 * `name` is kept optional for forward compatibility but should not be relied on.
 */
export interface InstalledExtension {
  bundle?: null | string;
  id?: string;
  meta?: {
    enabled?: boolean;
    folder?: null | string;
    id?: string;
    permissions?: null | unknown;
    source?: string;
  };
  name?: string;
  schema?: null | {
    local?: boolean;
    name?: string;
    partial?: boolean;
    type?: string;
    version?: string;
  };
}

/**
 * Registry search query parameters.
 */
export interface RegistrySearchQuery {
  limit?: number;
  offset?: number;
  sandbox?: boolean;
  search?: string;
  type?: string;
}

/**
 * Return the canonical name for an installed extension row.
 * Prefers `schema.name` (authoritative) and falls back to top-level `name`.
 */
export function getInstalledExtensionName(e: InstalledExtension): string | undefined {
  return e.schema?.name ?? e.name;
}

/**
 * Build a RestCommand that searches the marketplace registry.
 *
 * Note: the Directus SDK invokes commands as `command(client)`, so builders
 * must return a function — not a plain object — or `client.request()` will
 * throw `<arg> is not a function`.
 */
export function searchRegistry(query: RegistrySearchQuery): SdkRestCommand<{data: RegistryExtension[]; meta?: {filter_count?: number}}> {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  if (query.type) params.set('type', query.type);
  if (query.sandbox !== undefined) params.set('sandbox', String(query.sandbox));
  const qs = params.toString();
  return () => ({
    method: 'GET',
    path: `/extensions/registry${qs ? `?${qs}` : ''}`,
  });
}

/**
 * Build a RestCommand that fetches metadata for a single registry extension by UUID.
 */
export function describeRegistryExtension(extensionId: string): SdkRestCommand<{data: RegistryExtension}> {
  return () => ({
    method: 'GET',
    path: `/extensions/registry/extension/${encodeURIComponent(extensionId)}`,
  });
}

/**
 * Build a RestCommand that installs a registry extension.
 */
export function installRegistryExtension(extensionId: string, version: string): SdkRestCommand<unknown> {
  return () => ({
    body: JSON.stringify({extension: extensionId, version}),
    method: 'POST',
    path: '/extensions/registry/install',
  });
}

/**
 * Build a RestCommand that uninstalls an installed registry extension by its `directus_extensions.id` PK.
 */
export function uninstallRegistryExtension(pk: string): SdkRestCommand<unknown> {
  return () => ({
    method: 'DELETE',
    path: `/extensions/registry/uninstall/${encodeURIComponent(pk)}`,
  });
}

/**
 * Build a RestCommand that reinstalls a registry extension by the registry extension UUID.
 */
export function reinstallRegistryExtension(extensionId: string): SdkRestCommand<unknown> {
  return () => ({
    body: JSON.stringify({extension: extensionId}),
    method: 'POST',
    path: '/extensions/registry/reinstall',
  });
}

/**
 * Build a RestCommand that lists all installed extensions.
 */
export function listInstalledExtensions(): SdkRestCommand<InstalledExtension[] | {data: InstalledExtension[]}> {
  return () => ({
    method: 'GET',
    path: '/extensions/',
  });
}

/**
 * Normalize the response envelope into a data array.
 * Directus sometimes returns `{data: [...]}`, sometimes a bare array.
 */
export function unwrap<T>(result: T[] | {data?: T[]}): T[] {
  if (Array.isArray(result)) return result;
  return result.data ?? [];
}

/**
 * Resolve a user-provided identifier (name or UUID) to a registry extension.
 * UUIDs are passed through; names are resolved via search.
 */
export async function resolveRegistryExtension(
  client: DirectusClient,
  identifier: string,
): Promise<RegistryExtension> {
  if (isUuid(identifier)) {
    const res = await client.request(describeRegistryExtension(identifier));
    return res.data;
  }

  const res = await client.request(searchRegistry({limit: 25, search: identifier}));
  const matches = res.data ?? [];

  if (matches.length === 0) {
    throw new Error(`No registry extension matches "${identifier}".`);
  }

  const exact = matches.filter(m => m.name === identifier);
  if (exact.length === 1) return exact[0]!;
  if (exact.length > 1) {
    const ids = exact.map(m => m.id).join(', ');
    throw new Error(`Multiple registry extensions named "${identifier}": ${ids}. Specify the UUID.`);
  }

  if (matches.length === 1) return matches[0]!;

  const preview = matches.slice(0, 5).map(m => `  - ${m.name} (${m.id})`).join('\n');
  throw new Error(`Ambiguous extension name "${identifier}". ${matches.length} registry matches:\n${preview}\nSpecify the UUID or a more exact name.`);
}

/**
 * Resolve a user-provided identifier (name or PK) to an installed extension row.
 *
 * Matching order:
 *   1. If identifier is a UUID, match by `meta.id` or `id` (row PK).
 *   2. Match by extension name (`schema.name`, falling back to top-level `name`).
 */
export async function resolveInstalledExtension(
  client: DirectusClient,
  identifier: string,
): Promise<InstalledExtension> {
  const raw = await client.request(listInstalledExtensions());
  const installed = unwrap(raw);

  if (isUuid(identifier)) {
    const byPk = installed.find(e => e.meta?.id === identifier || e.id === identifier);
    if (byPk) return byPk;
  }

  const byName = installed.filter(e => getInstalledExtensionName(e) === identifier);
  if (byName.length === 1) return byName[0]!;
  if (byName.length > 1) {
    throw new Error(`Multiple installed extensions named "${identifier}". Specify the directus_extensions row id.`);
  }

  throw new Error(`No installed extension matches "${identifier}".`);
}

/**
 * Pick the latest non-prerelease, non-unsafe version string from a list of
 * version entries.
 *
 * Selection order:
 *   1. Filter out entries flagged `unsafe: true` (never install these).
 *   2. Prefer the first stable (non-prerelease) version from the filtered list.
 *   3. Fall back to the first non-unsafe entry (may be a prerelease).
 *
 * Throws if every published version is unsafe.
 */
export function pickLatestVersion(versions: RegistryExtensionVersion[] | undefined): string {
  if (!versions || versions.length === 0) {
    throw new Error('Extension has no published versions in the registry.');
  }

  const safe = versions.filter(v => !v.unsafe);
  if (safe.length === 0) {
    throw new Error('Extension has no safe published versions in the registry (all entries are marked unsafe).');
  }

  const stable = safe.find(v => !isPrerelease(v.version));
  const chosen = stable ?? safe[0]!;
  return chosen.version;
}

/**
 * Split an identifier of the form `name@version` into its parts.
 * Returns `{identifier, version}` where `version` is undefined if no `@` suffix is present.
 */
export function parseVersionedIdentifier(input: string): {identifier: string; version?: string} {
  const at = input.lastIndexOf('@');
  // Ignore a leading @ (used by scoped npm-style names, though not expected here)
  if (at > 0) {
    return {identifier: input.slice(0, at), version: input.slice(at + 1) || undefined};
  }

  return {identifier: input};
}

const UUID_RE = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function isPrerelease(version: string): boolean {
  // Semver prerelease identifier: anything after the first `-` in the version core.
  return /-[\dA-Za-z-]/.test(version);
}
