import {deletePolicy} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Delete an access policy.
 */
export default class PoliciesDelete extends BaseCommand<typeof PoliciesDelete> {
  static override args = {
    id: Args.string({
      description: 'Policy ID',
      required: true,
    }),
  };
  static override description = 'Delete an access policy from the Directus instance';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <policy-id>',
    '<%= config.bin %> <%= command.id %> <policy-id> --yes',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    yes: Flags.boolean({
      char: 'y',
      default: false,
      description: 'Skip confirmation prompt',
    }),
  };
  static override summary = 'Delete policy';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PoliciesDelete);

    if (!flags.yes) {
      const confirmed = await this.confirm(`Are you sure you want to delete policy ${args.id}? (yes/no)`);
      if (!confirmed) {
        this.log('Cancelled.');
        return;
      }
    }

    const sdkCommand = deletePolicy(args.id) as unknown as SdkRestCommand<void>;
    await this.client.request(sdkCommand);

    this.log(`Policy ${args.id} deleted successfully.`);
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
