import {readFlow} from '@directus/sdk';
import {Args} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Get a flow by ID.
 */
export default class FlowsGet extends BaseCommand<typeof FlowsGet> {
  static override args = {
    id: Args.string({
      description: 'Flow ID',
      required: true,
    }),
  };
  static override description = 'Get a flow by ID';
  static override examples = ['<%= config.bin %> <%= command.id %> <flow-id>'];
  static override flags = {
    ...BaseCommand.baseFlags,
  };
  static override summary = 'Get flow';

  public async run(): Promise<void> {
    const {args} = await this.parse(FlowsGet);

    const sdkCommand = readFlow(args.id) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
