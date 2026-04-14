import {deletePreset} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Delete a preset.
 */
export default class PresetsDelete extends BaseCommand<typeof PresetsDelete> {
  static override args = {
    id: Args.string({
      description: 'Preset ID',
      required: true,
    }),
  };
  static override description = 'Delete a preset (bookmark)';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <preset-id>',
    '<%= config.bin %> <%= command.id %> <preset-id> --yes',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    yes: Flags.boolean({
      char: 'y',
      default: false,
      description: 'Skip confirmation prompt',
    }),
  };
  static override summary = 'Delete preset';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PresetsDelete);

    if (!flags.yes) {
      const confirmed = await this.confirm(`Are you sure you want to delete preset "${args.id}"? (yes/no)`);
      if (!confirmed) {
        this.log('Cancelled.');
        return;
      }
    }

    const sdkCommand = deletePreset(Number(args.id)) as unknown as SdkRestCommand<void>;
    await this.client.request(sdkCommand);

    this.log(`Preset "${args.id}" deleted successfully.`);
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
