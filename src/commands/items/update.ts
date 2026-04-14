import {updateItem} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';
import {readFileSync} from 'node:fs';

import type {
  ItemData, ItemsCommandArgs, SdkQuery, SdkRestCommand,
} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';
import {parseFields} from '../../lib/filter.js';

/**
 * Update an existing item.
 */
export default class ItemsUpdate extends BaseCommand<typeof ItemsUpdate> {
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
  static override description = 'Update an existing item in a collection';
  static override examples = [
    String.raw`<%= config.bin %> <%= command.id %> posts 1 --data '{"title":"Updated"}'`,
    '<%= config.bin %> <%= command.id %> posts 1 --file ./update.json',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    data: Flags.string({
      char: 'd',
      description: 'JSON string of update data',
      helpValue: '<json>',
    }),
    fields: Flags.string({
      char: 'f',
      description: 'Comma-separated fields to return',
      helpValue: '<fields>',
    }),
    file: Flags.string({
      description: 'Path to JSON file with update data',
      helpValue: '<path>',
    }),
  };
  static override summary = 'Update an item';

  public async run(): Promise<void> {
    const {flags} = await this.parse(ItemsUpdate);

    // Safely access args with proper typing
    const args = this.args as ItemsCommandArgs;
    const {collection, id} = args;

    // Get data from --data or --file
    let itemData: ItemData;

    if (flags.file) {
      const content = readFileSync(flags.file, 'utf8');
      itemData = JSON.parse(content) as ItemData;
    } else if (flags.data) {
      itemData = JSON.parse(flags.data) as ItemData;
    } else {
      this.error('Either --data or --file must be provided');
    }

    const fields = flags.fields ? parseFields(flags.fields) : undefined;

    // Build SDK query
    const query: SdkQuery = {};
    if (fields) query.fields = fields;

    // Create SDK command - cast through unknown to handle schema typing
    const sdkCommand = updateItem(
      collection as never,
      id as never,
      itemData as never,
      query as never,
    ) as unknown as SdkRestCommand<unknown>;

    const result = await this.client.request(sdkCommand);

    // Handle response format
    const data = (result as {data?: unknown}).data ?? result;

    this.outputFormatted(data);
  }
}
