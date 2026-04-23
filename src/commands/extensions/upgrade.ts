import {Args, Flags} from '@oclif/core';

import {BaseCommand} from '../../base-command.js';
import {
  describeRegistryExtension,
  getInstalledExtensionName,
  installRegistryExtension,
  parseVersionedIdentifier,
  pickLatestVersion,
  resolveInstalledExtension,
  resolveRegistryExtension,
  uninstallRegistryExtension,
} from '../../lib/extensions-registry.js';

/**
 * Upgrade an installed registry extension to a newer version.
 *
 * Not atomic: performs an uninstall followed by an install. There is a brief
 * window during which the extension is absent from the target instance.
 */
export default class ExtensionsUpgrade extends BaseCommand<typeof ExtensionsUpgrade> {
  static override args = {
    extension: Args.string({
      description: 'Extension name or directus_extensions row id, optionally with `@<version>` suffix',
      required: true,
    }),
  };
  static override description
    = 'Upgrade an installed registry extension by uninstalling and reinstalling a newer version. NOT atomic: the extension is briefly unavailable between steps.';
  static override examples = [
    '<%= config.bin %> <%= command.id %> directus-extension-computed-interface',
    '<%= config.bin %> <%= command.id %> directus-extension-computed-interface@3.0.0 --yes',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    yes: Flags.boolean({
      char: 'y',
      default: false,
      description: 'Skip confirmation prompt',
    }),
  };
  static override summary = 'Upgrade extension (non-atomic)';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ExtensionsUpgrade);

    const {identifier, version} = parseVersionedIdentifier(args.extension);
    const installed = await resolveInstalledExtension(this.client, identifier);
    const pk = installed.meta?.id ?? installed.id;
    const registryName = getInstalledExtensionName(installed);
    // `displayName` is only used in log/error messages. Registry lookups MUST
    // use the resolved extension name; falling back to the user-provided
    // identifier would let a directus_extensions row UUID leak into the
    // registry endpoint (where it would be treated as a registry UUID and 404).
    const displayName = registryName ?? identifier;

    if (!pk) {
      this.error(`Could not determine the directus_extensions row id for "${displayName}".`);
    }

    if (installed.meta?.source && installed.meta.source !== 'registry') {
      this.error(`Extension "${displayName}" has source "${installed.meta.source}" and cannot be upgraded via the API.`);
    }

    if (!registryName) {
      this.error(`Could not determine the extension name for "${displayName}". The installed row has no schema.name or name field, so the registry cannot be queried. Pass the extension name instead of a row id.`);
    }

    const registry = await resolveRegistryExtension(this.client, registryName);
    const details = await this.client.request(describeRegistryExtension(registry.id));

    let targetVersion: string;
    if (!version || version === 'latest') {
      targetVersion = pickLatestVersion(details.data.versions);
    } else {
      const available = (details.data.versions ?? []).map(v => v.version);
      if (!available.includes(version)) {
        this.error(`Version "${version}" is not available for "${registry.name}". Available: ${available.slice(0, 10).join(', ')}${available.length > 10 ? ', …' : ''}`);
      }

      targetVersion = version;
    }

    const currentVersion = installed.schema?.version ?? 'unknown';

    if (currentVersion === targetVersion) {
      this.log(`Extension "${displayName}" is already at version ${targetVersion}. Nothing to do.`);
      return;
    }

    if (!flags.yes) {
      const confirmed = await this.confirm(`Upgrade "${displayName}" from ${currentVersion} to ${targetVersion}? The extension will be briefly unavailable. (yes/no)`);
      if (!confirmed) {
        this.log('Cancelled.');
        return;
      }
    }

    this.log(`Uninstalling ${displayName}@${currentVersion} …`);
    await this.client.request(uninstallRegistryExtension(pk));

    this.log(`Installing ${displayName}@${targetVersion} …`);
    try {
      await this.client.request(installRegistryExtension(registry.id, targetVersion));
    } catch (error) {
      const retryCmd = `directus-cli extensions install ${registry.name}@${targetVersion}`;
      const originalMessage = (error as Error).message;
      this.error(`Upgrade failed after uninstall. The extension is currently removed from the target instance. You can retry with: ${retryCmd}\nOriginal error: ${originalMessage}`);
    }

    this.log(`Extension "${displayName}" upgraded to ${targetVersion}.`);
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
