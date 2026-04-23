import {Args} from '@oclif/core';

import {BaseCommand} from '../../base-command.js';
import {
  getInstalledExtensionName,
  reinstallRegistryExtension,
  resolveInstalledExtension,
  resolveRegistryExtension,
} from '../../lib/extensions-registry.js';

/**
 * Re-download the pinned version of an installed registry extension.
 */
export default class ExtensionsReinstall extends BaseCommand<typeof ExtensionsReinstall> {
  static override args = {
    extension: Args.string({
      description: 'Extension name or directus_extensions row id',
      required: true,
    }),
  };
  static override description
    = 'Re-download and reinstall a registry-sourced extension at its currently pinned version.';
  static override examples = [
    '<%= config.bin %> <%= command.id %> directus-extension-computed-interface',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
  };
  static override summary = 'Reinstall extension';

  public async run(): Promise<void> {
    const {args} = await this.parse(ExtensionsReinstall);

    // Confirm the extension is installed + registry-sourced.
    const installed = await resolveInstalledExtension(this.client, args.extension);
    const registryName = getInstalledExtensionName(installed);
    // `displayName` is only used in log/error messages. Registry lookups MUST
    // use the resolved extension name; falling back to `args.extension` there
    // would let a directus_extensions row UUID leak into the registry endpoint
    // (where it would be treated as a registry UUID and 404).
    const displayName = registryName ?? args.extension;

    if (installed.meta?.source && installed.meta.source !== 'registry') {
      this.error(`Extension "${displayName}" has source "${installed.meta.source}" and cannot be reinstalled via the API.`);
    }

    if (!registryName) {
      this.error(`Could not determine the extension name for "${displayName}". The installed row has no schema.name or name field, so the registry cannot be queried. Pass the extension name instead of a row id.`);
    }

    // The reinstall endpoint expects the registry extension UUID, not the row PK.
    const registry = await resolveRegistryExtension(this.client, registryName);

    this.log(`Reinstalling ${displayName} … (this may take up to 2 minutes)`);
    await this.client.request(reinstallRegistryExtension(registry.id));
    this.log(`Extension "${displayName}" reinstalled.`);
  }
}
