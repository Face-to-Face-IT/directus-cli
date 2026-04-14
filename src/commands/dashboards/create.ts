import {createDashboard} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Create a new dashboard.
 */
export default class DashboardsCreate extends BaseCommand<typeof DashboardsCreate> {
  static override args = {
    name: Args.string({
      description: 'Dashboard name',
      required: true,
    }),
  };
  static override description = 'Create a new analytics dashboard';
  static override examples = [
    '<%= config.bin %> <%= command.id %> "Sales Overview"',
    '<%= config.bin %> <%= command.id %> "User Analytics" --color "#3498db"',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    color: Flags.string({
      char: 'c',
      description: 'Dashboard color (hex code)',
      helpValue: '<hex>',
    }),
    icon: Flags.string({
      default: 'dashboard',
      description: 'Dashboard icon',
    }),
    note: Flags.string({
      char: 'n',
      description: 'Dashboard description/note',
      helpValue: '<text>',
    }),
  };
  static override summary = 'Create dashboard';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DashboardsCreate);

    const dashboardData: Record<string, unknown> = {
      name: args.name,
    };

    if (flags.color) dashboardData.color = flags.color;
    if (flags.icon) dashboardData.icon = flags.icon;
    if (flags.note) dashboardData.note = flags.note;

    const sdkCommand = createDashboard(dashboardData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
