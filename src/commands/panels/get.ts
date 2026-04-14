import {readPanel} from '@directus/sdk';
import {Args} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Get a panel by ID.
 */
export default class PanelsGet extends BaseCommand<typeof PanelsGet> {
  static override args = {
    id: Args.string({
      description: 'Panel ID',
      required: true,
    }),
  };
  static override description = 'Get a panel by ID';
  static override examples = ['<%= config.bin %> <%= command.id %> <panel-id>'];
  static override flags = {
    ...BaseCommand.baseFlags,
  };
  static override summary = 'Get panel';

  public async run(): Promise<void> {
    const {args} = await this.parse(PanelsGet);

    const sdkCommand = readPanel(args.id) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
