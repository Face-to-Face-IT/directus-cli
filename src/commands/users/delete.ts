import {deleteUser} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Delete a user.
 */
export default class UsersDelete extends BaseCommand<typeof UsersDelete> {
  static override args = {
    id: Args.string({
      description: 'User ID',
      required: true,
    }),
  };
  static override description = 'Delete a user from the Directus instance';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <user-id>',
    '<%= config.bin %> <%= command.id %> <user-id> --yes',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    yes: Flags.boolean({
      char: 'y',
      default: false,
      description: 'Skip confirmation prompt',
    }),
  };
  static override summary = 'Delete user';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(UsersDelete);

    if (!flags.yes) {
      const confirmed = await this.confirm(`Are you sure you want to delete user ${args.id}? (yes/no)`);
      if (!confirmed) {
        this.log('Cancelled.');
        return;
      }
    }

    const sdkCommand = deleteUser(args.id) as unknown as SdkRestCommand<void>;
    await this.client.request(sdkCommand);

    this.log(`User ${args.id} deleted successfully.`);
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
