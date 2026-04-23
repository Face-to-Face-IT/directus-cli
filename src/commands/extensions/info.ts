import {Args} from '@oclif/core';

import {BaseCommand} from '../../base-command.js';
import {describeRegistryExtension, resolveRegistryExtension, unwrapOne} from '../../lib/extensions-registry.js';

/**
 * Show metadata and available versions for a registry extension.
 */
export default class ExtensionsInfo extends BaseCommand<typeof ExtensionsInfo> {
  static override args = {
    extension: Args.string({
      description: 'Extension name or registry UUID',
      required: true,
    }),
  };
  static override description = 'Show registry metadata and available versions for an extension';
  static override examples = [
    '<%= config.bin %> <%= command.id %> directus-extension-computed-interface',
    '<%= config.bin %> <%= command.id %> 12345678-1234-1234-1234-123456789abc',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
  };
  static override summary = 'Show extension metadata';

  public async run(): Promise<void> {
    const {args} = await this.parse(ExtensionsInfo);

    // Resolve name → UUID if needed, then fetch full details by UUID so we
    // always get the full versions array.
    const resolved = await resolveRegistryExtension(this.client, args.extension);
    const full = await this.client.request(describeRegistryExtension(resolved.id));

    const ext = unwrapOne(full);
    const data = {
      description: ext.description ?? null,
      host: ext.host ?? null,
      id: ext.id,
      // eslint-disable-next-line camelcase
      last_updated: ext.last_updated ?? null,
      license: ext.license ?? null,
      name: ext.name,
      publisher: ext.publisher ?? null,
      sandbox: ext.sandbox ?? false,
      // eslint-disable-next-line camelcase
      total_downloads: ext.total_downloads ?? ext.downloads ?? 0,
      type: ext.type ?? null,
      versions: (ext.versions ?? []).map(v => ({
        // eslint-disable-next-line camelcase
        host_version: v.host_version ?? null,
        // eslint-disable-next-line camelcase
        publish_date: v.publish_date ?? null,
        type: v.type ?? null,
        unsafe: v.unsafe ?? false,
        verified: v.verified ?? false,
        version: v.version,
      })),
    };

    this.outputFormatted(data);
  }
}
