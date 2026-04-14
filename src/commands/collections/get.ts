import {readCollection} from '@directus/sdk';
import {Args} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Get a single collection by name.
 */
export default class CollectionsGet extends BaseCommand<typeof CollectionsGet> {
  static override args = {
    name: Args.string({
      description: 'Collection name',
      required: true,
    }),
  };
  static override description = 'Get a collection by name';
  static override examples = ['<%= config.bin %> <%= command.id %> cases'];
  static override flags = {
    ...BaseCommand.baseFlags,
  };
  static override summary = 'Get collection';

  public async run(): Promise<void> {
    const {args} = await this.parse(CollectionsGet);

    const sdkCommand = readCollection(args.name as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
