import {Args} from '@oclif/core';

import {BaseCommand} from '../../base-command.js';
import {
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

    if (installed.meta?.source && installed.meta.source !== 'registry') {
      this.error(`Extension "${installed.name}" has source "${installed.meta.source}" and cannot be reinstalled via the API.`);
    }

    // The reinstall endpoint expects the registry extension UUID, not the row PK.
    const registry = await resolveRegistryExtension(this.client, installed.name);

    this.log(`Reinstalling ${installed.name} … (this may take up to 2 minutes)`);
    await this.client.request(reinstallRegistryExtension(registry.id));
    this.log(`Extension "${installed.name}" reinstalled.`);
  }
}
