import {readField} from '@directus/sdk';
import {Args} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Get a single field by collection and field name.
 */
export default class FieldsGet extends BaseCommand<typeof FieldsGet> {
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
  static override description = 'Get a field by collection and name';
  static override examples = ['<%= config.bin %> <%= command.id %> cases title'];
  static override flags = {
    ...BaseCommand.baseFlags,
  };
  static override summary = 'Get field';

  public async run(): Promise<void> {
    const {args} = await this.parse(FieldsGet);

    const sdkCommand = readField(args.collection, args.field) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
