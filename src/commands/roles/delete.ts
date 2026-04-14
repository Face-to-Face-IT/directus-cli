import {deleteRole} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Delete a role.
 */
export default class RolesDelete extends BaseCommand<typeof RolesDelete> {
  static override args = {
    id: Args.string({
      description: 'Role ID',
      required: true,
    }),
  };
  static override description = 'Delete a role from the Directus instance';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <role-id>',
    '<%= config.bin %> <%= command.id %> <role-id> --yes',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    yes: Flags.boolean({
      char: 'y',
      default: false,
      description: 'Skip confirmation prompt',
    }),
  };
  static override summary = 'Delete role';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(RolesDelete);

    if (!flags.yes) {
      const confirmed = await this.confirm(`Are you sure you want to delete role ${args.id}? (yes/no)`);
      if (!confirmed) {
        this.log('Cancelled.');
        return;
      }
    }

    const sdkCommand = deleteRole(args.id) as unknown as SdkRestCommand<void>;
    await this.client.request(sdkCommand);

    this.log(`Role ${args.id} deleted successfully.`);
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
