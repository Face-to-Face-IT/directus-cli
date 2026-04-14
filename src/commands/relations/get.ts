import {readRelation} from '@directus/sdk';
import {Args} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Get a relation by collection and field.
 */
export default class RelationsGet extends BaseCommand<typeof RelationsGet> {
  static override args = {
    collection: Args.string({
      description: 'Collection name',
      required: true,
    }),
    field: Args.string({
      description: 'Field name',
      required: true,
    }),
  };
  static override description = 'Get a relation by collection and field name';
  static override examples = ['<%= config.bin %> <%= command.id %> cases assigned_to'];
  static override flags = {
    ...BaseCommand.baseFlags,
  };
  static override summary = 'Get relation';

  public async run(): Promise<void> {
    const {args} = await this.parse(RelationsGet);

    const sdkCommand = readRelation(args.collection, args.field) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
