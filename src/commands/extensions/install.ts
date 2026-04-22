import {Args} from '@oclif/core';

import {BaseCommand} from '../../base-command.js';
import {
  describeRegistryExtension,
  installRegistryExtension,
  parseVersionedIdentifier,
  pickLatestVersion,
  resolveRegistryExtension,
} from '../../lib/extensions-registry.js';

/**
 * Install an extension from the Directus marketplace registry.
 */
export default class ExtensionsInstall extends BaseCommand<typeof ExtensionsInstall> {
  static override args = {
    extension: Args.string({
      description: 'Extension name or UUID, optionally with `@<version>` suffix',
      required: true,
    }),
  };
  static override description
    = 'Install an extension from the Directus marketplace registry. Admin-only. Supports `name@version` for pinning.';
  static override examples = [
    '<%= config.bin %> <%= command.id %> directus-extension-computed-interface',
    '<%= config.bin %> <%= command.id %> directus-extension-computed-interface@2.0.0',
    '<%= config.bin %> <%= command.id %> 12345678-1234-1234-1234-123456789abc@latest',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
  };
  static override summary = 'Install extension from registry';

  public async run(): Promise<void> {
    const {args} = await this.parse(ExtensionsInstall);

    const {identifier, version} = parseVersionedIdentifier(args.extension);
    const resolved = await resolveRegistryExtension(this.client, identifier);

    let targetVersion: string;
    if (!version || version === 'latest') {
      const full = await this.client.request(describeRegistryExtension(resolved.id));
      targetVersion = pickLatestVersion(full.data.versions);
    } else {
      // Validate the requested version exists in the registry
      const full = await this.client.request(describeRegistryExtension(resolved.id));
      const available = (full.data.versions ?? []).map(v => v.version);
      if (!available.includes(version)) {
        this.error(`Version "${version}" is not available for "${resolved.name}". Available: ${available.slice(0, 10).join(', ')}${available.length > 10 ? ', …' : ''}`);
      }

      targetVersion = version;
    }

    this.log(`Installing ${resolved.name}@${targetVersion} … (this may take up to 2 minutes)`);
    const result = await this.client.request(installRegistryExtension(resolved.id, targetVersion));

    this.outputFormatted({
      extension: resolved.name,
      id: resolved.id,
      installed: true,
      result,
      version: targetVersion,
    });
  }
}
