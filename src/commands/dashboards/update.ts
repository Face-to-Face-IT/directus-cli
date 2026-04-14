import {updateDashboard} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Update an existing dashboard.
 */
export default class DashboardsUpdate extends BaseCommand<typeof DashboardsUpdate> {
  static override args = {
    id: Args.string({
      description: 'Dashboard ID',
      required: true,
    }),
  };
  static override description = 'Update a dashboard';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <dashboard-id> --name "Updated Name"',
    '<%= config.bin %> <%= command.id %> <dashboard-id> --color "#e74c3c"',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    color: Flags.string({
      char: 'c',
      description: 'Dashboard color (hex code)',
      helpValue: '<hex>',
    }),
    icon: Flags.string({
      description: 'Dashboard icon',
    }),
    name: Flags.string({
      char: 'n',
      description: 'Dashboard name',
    }),
    note: Flags.string({
      description: 'Dashboard description/note',
      helpValue: '<text>',
    }),
  };
  static override summary = 'Update dashboard';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DashboardsUpdate);

    const dashboardData: Record<string, unknown> = {};

    if (flags.name) dashboardData.name = flags.name;
    if (flags.color !== undefined) dashboardData.color = flags.color;
    if (flags.icon !== undefined) dashboardData.icon = flags.icon;
    if (flags.note !== undefined) dashboardData.note = flags.note;

    if (Object.keys(dashboardData).length === 0) {
      this.error('At least one field to update must be provided');
    }

    const sdkCommand = updateDashboard(args.id, dashboardData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
