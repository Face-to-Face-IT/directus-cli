import {deleteDashboard} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Delete a dashboard.
 */
export default class DashboardsDelete extends BaseCommand<typeof DashboardsDelete> {
  static override args = {
    id: Args.string({
      description: 'Dashboard ID',
      required: true,
    }),
  };
  static override description = 'Delete a dashboard and its panels';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <dashboard-id>',
    '<%= config.bin %> <%= command.id %> <dashboard-id> --yes',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    yes: Flags.boolean({
      char: 'y',
      default: false,
      description: 'Skip confirmation prompt',
    }),
  };
  static override summary = 'Delete dashboard';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DashboardsDelete);

    if (!flags.yes) {
      const confirmed = await this.confirm(`Are you sure you want to delete dashboard "${args.id}"? This will also delete all panels. (yes/no)`);
      if (!confirmed) {
        this.log('Cancelled.');
        return;
      }
    }

    const sdkCommand = deleteDashboard(args.id) as unknown as SdkRestCommand<void>;
    await this.client.request(sdkCommand);

    this.log(`Dashboard "${args.id}" deleted successfully.`);
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
