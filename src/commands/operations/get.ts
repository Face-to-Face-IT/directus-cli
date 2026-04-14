import {readOperation} from '@directus/sdk';
import {Args} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Get an operation by ID.
 */
export default class OperationsGet extends BaseCommand<typeof OperationsGet> {
  static override args = {
    id: Args.string({
      description: 'Operation ID',
      required: true,
    }),
  };
  static override description = 'Get an operation by ID';
  static override examples = ['<%= config.bin %> <%= command.id %> <operation-id>'];
  static override flags = {
    ...BaseCommand.baseFlags,
  };
  static override summary = 'Get operation';

  public async run(): Promise<void> {
    const {args} = await this.parse(OperationsGet);

    const sdkCommand = readOperation(args.id) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
