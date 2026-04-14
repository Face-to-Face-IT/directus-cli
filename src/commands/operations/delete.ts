import {deleteOperation} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Delete an operation.
 */
export default class OperationsDelete extends BaseCommand<typeof OperationsDelete> {
  static override args = {
    id: Args.string({
      description: 'Operation ID',
      required: true,
    }),
  };
  static override description = 'Delete a flow operation';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <operation-id>',
    '<%= config.bin %> <%= command.id %> <operation-id> --yes',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    yes: Flags.boolean({
      char: 'y',
      default: false,
      description: 'Skip confirmation prompt',
    }),
  };
  static override summary = 'Delete operation';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(OperationsDelete);

    if (!flags.yes) {
      const confirmed = await this.confirm(`Are you sure you want to delete operation "${args.id}"? (yes/no)`);
      if (!confirmed) {
        this.log('Cancelled.');
        return;
      }
    }

    const sdkCommand = deleteOperation(args.id) as unknown as SdkRestCommand<void>;
    await this.client.request(sdkCommand);

    this.log(`Operation "${args.id}" deleted successfully.`);
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
