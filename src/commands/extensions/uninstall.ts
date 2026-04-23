import {Args, Flags} from '@oclif/core';

import {BaseCommand} from '../../base-command.js';
import {
  getInstalledExtensionName,
  resolveInstalledExtension,
  uninstallRegistryExtension,
} from '../../lib/extensions-registry.js';

/**
 * Uninstall a registry-sourced extension.
 */
export default class ExtensionsUninstall extends BaseCommand<typeof ExtensionsUninstall> {
  static override args = {
    extension: Args.string({
      description: 'Extension name or directus_extensions row id',
      required: true,
    }),
  };
  static override description
    = 'Uninstall a registry-sourced extension. Local-folder and npm-module extensions cannot be uninstalled via the API.';
  static override examples = [
    '<%= config.bin %> <%= command.id %> directus-extension-computed-interface',
    '<%= config.bin %> <%= command.id %> directus-extension-computed-interface --yes',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    yes: Flags.boolean({
      char: 'y',
      default: false,
      description: 'Skip confirmation prompt',
    }),
  };
  static override summary = 'Uninstall extension';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ExtensionsUninstall);

    const installed = await resolveInstalledExtension(this.client, args.extension);
    const pk = installed.meta?.id ?? installed.id;
    const name = getInstalledExtensionName(installed) ?? args.extension;

    if (!pk) {
      this.error(`Could not determine the directus_extensions row id for "${name}".`);
    }

    if (installed.meta?.source && installed.meta.source !== 'registry') {
      this.error(`Extension "${name}" has source "${installed.meta.source}" and cannot be uninstalled via the API. Only registry-sourced extensions are supported.`);
    }

    if (!flags.yes) {
      const confirmed = await this.confirm(`Are you sure you want to uninstall "${name}"? (yes/no)`);
      if (!confirmed) {
        this.log('Cancelled.');
        return;
      }
    }

    await this.client.request(uninstallRegistryExtension(pk));
    this.log(`Extension "${name}" uninstalled.`);
  }

  private async confirm(prompt: string): Promise<boolean> {
    const response = await new Promise<string>(resolve => {
      process.stdout.write(prompt + ' ');
      process.stdin.once('data', data => {
        resolve(data.toString().trim().toLowerCase());
      });
    });
    return response === 'yes' || response === 'y';
  }
}
