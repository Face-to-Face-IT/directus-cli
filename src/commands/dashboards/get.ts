import {readDashboard} from '@directus/sdk';
import {Args} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Get a dashboard by ID.
 */
export default class DashboardsGet extends BaseCommand<typeof DashboardsGet> {
  static override args = {
    id: Args.string({
      description: 'Dashboard ID',
      required: true,
    }),
  };
  static override description = 'Get a dashboard by ID';
  static override examples = ['<%= config.bin %> <%= command.id %> <dashboard-id>'];
  static override flags = {
    ...BaseCommand.baseFlags,
  };
  static override summary = 'Get dashboard';

  public async run(): Promise<void> {
    const {args} = await this.parse(DashboardsGet);

    const sdkCommand = readDashboard(args.id) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
