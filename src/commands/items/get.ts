import {readItem} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {ItemsCommandArgs, SdkQuery, SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';
import {parseFields} from '../../lib/filter.js';

/**
 * Get a single item by ID.
 */
export default class ItemsGet extends BaseCommand<typeof ItemsGet> {
  static override args = {
    collection: Args.string({
      description: 'Collection name',
      required: true,
    }),
    id: Args.string({
      description: 'Item ID',
      required: true,
    }),
  };
  static override description = 'Retrieve a single item from a collection by ID';
  static override examples = [
    '<%= config.bin %> <%= command.id %> posts 1',
    '<%= config.bin %> <%= command.id %> posts 1 --fields id,title,content',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    fields: Flags.string({
      char: 'f',
      description: 'Comma-separated fields to retrieve',
      helpValue: '<fields>',
    }),
  };
  static override summary = 'Get an item';

  public async run(): Promise<void> {
    const {flags} = await this.parse(ItemsGet);

    // Safely access args with proper typing
    const args = this.args as ItemsCommandArgs;
    const {collection, id} = args;

    const fields = flags.fields ? parseFields(flags.fields) : undefined;

    // Build SDK query
    const query: SdkQuery = {};
    if (fields) query.fields = fields;

    // Create SDK command - cast through unknown to handle schema typing
    const sdkCommand = readItem(collection as never, id as never, query as never) as unknown as SdkRestCommand<unknown>;

    const result = await this.client.request(sdkCommand);

    // Handle response format
    const data = (result as {data?: unknown}).data ?? result;

    this.outputFormatted(data);
  }
}
