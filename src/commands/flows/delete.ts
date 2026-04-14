import {deleteFlow} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Delete a flow.
 */
export default class FlowsDelete extends BaseCommand<typeof FlowsDelete> {
  static override args = {
    id: Args.string({
      description: 'Flow ID',
      required: true,
    }),
  };
  static override description = 'Delete a flow and its operations';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <flow-id>',
    '<%= config.bin %> <%= command.id %> <flow-id> --yes',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    yes: Flags.boolean({
      char: 'y',
      default: false,
      description: 'Skip confirmation prompt',
    }),
  };
  static override summary = 'Delete flow';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(FlowsDelete);

    if (!flags.yes) {
      const confirmed = await this.confirm(`Are you sure you want to delete flow "${args.id}"? This will also delete all operations in this flow. (yes/no)`);
      if (!confirmed) {
        this.log('Cancelled.');
        return;
      }
    }

    const sdkCommand = deleteFlow(args.id) as unknown as SdkRestCommand<void>;
    await this.client.request(sdkCommand);

    this.log(`Flow "${args.id}" deleted successfully.`);
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
