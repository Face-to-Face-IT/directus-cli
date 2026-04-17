import { updateExtension } from '@directus/sdk';
import { Args, Flags } from '@oclif/core';

import type { SdkRestCommand } from '../../types/index.js';

import { BaseCommand } from '../../base-command.js';

/**
 * Enable or disable an extension.
 */
export default class ExtensionsToggle extends BaseCommand<typeof ExtensionsToggle> {
  static override args = {
    name: Args.string({
      description: 'Extension name',
      required: true,
    }),
  };
  static override description = 'Enable or disable an extension by name';
  static override examples = [
    '<%= config.bin %> <%= command.id %> my-extension --enable',
    '<%= config.bin %> <%= command.id %> my-extension --disable',
    '<%= config.bin %> <%= command.id %> my-extension --enable --bundle my-bundle',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    bundle: Flags.string({
      description: 'Bundle name if the extension belongs to a bundle',
      helpValue: '<bundle>',
    }),
    disable: Flags.boolean({
      description: 'Disable the extension',
      exclusive: ['enable'],
    }),
    enable: Flags.boolean({
      description: 'Enable the extension',
      exclusive: ['disable'],
    }),
  };
  static override summary = 'Enable or disable an extension';

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ExtensionsToggle);

    if (!flags.enable && !flags.disable) {
      this.error('You must specify either --enable or --disable');
    }

    const enabled = Boolean(flags.enable);
    const bundle = flags.bundle ?? null;

    const sdkCommand = updateExtension(bundle, args.name, {
      meta: { enabled },
    }) as unknown as SdkRestCommand<unknown>;

    const result = await this.client.request(sdkCommand);
    this.outputFormatted(result);
  }
}
