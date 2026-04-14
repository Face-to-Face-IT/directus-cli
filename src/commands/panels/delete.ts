import {deletePanel} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Delete a panel.
 */
export default class PanelsDelete extends BaseCommand<typeof PanelsDelete> {
  static override args = {
    id: Args.string({
      description: 'Panel ID',
      required: true,
    }),
  };
  static override description = 'Delete a dashboard panel';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <panel-id>',
    '<%= config.bin %> <%= command.id %> <panel-id> --yes',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    yes: Flags.boolean({
      char: 'y',
      default: false,
      description: 'Skip confirmation prompt',
    }),
  };
  static override summary = 'Delete panel';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PanelsDelete);

    if (!flags.yes) {
      const confirmed = await this.confirm(`Are you sure you want to delete panel "${args.id}"? (yes/no)`);
      if (!confirmed) {
        this.log('Cancelled.');
        return;
      }
    }

    const sdkCommand = deletePanel(args.id) as unknown as SdkRestCommand<void>;
    await this.client.request(sdkCommand);

    this.log(`Panel "${args.id}" deleted successfully.`);
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
