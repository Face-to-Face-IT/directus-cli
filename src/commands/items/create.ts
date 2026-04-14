import {createItem} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';
import {readFileSync} from 'node:fs';

import type {
  ItemData, ItemsCommandArgs, SdkQuery, SdkRestCommand,
} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';
import {parseFields} from '../../lib/filter.js';

/**
 * Create a new item in a collection.
 */
export default class ItemsCreate extends BaseCommand<typeof ItemsCreate> {
  static override args = {
    collection: Args.string({
      description: 'Collection name',
      required: true,
    }),
  };
  static override description = 'Create a new item in a Directus collection';
  static override examples = [
    String.raw`<%= config.bin %> <%= command.id %> posts --data '{"title":"Hello","status":"published"}'`,
    '<%= config.bin %> <%= command.id %> posts --file ./data.json',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    data: Flags.string({
      char: 'd',
      description: 'JSON string of item data',
      helpValue: '<json>',
    }),
    fields: Flags.string({
      char: 'f',
      description: 'Comma-separated fields to return',
      helpValue: '<fields>',
    }),
    file: Flags.string({
      description: 'Path to JSON file with item data',
      helpValue: '<path>',
    }),
  };
  static override summary = 'Create an item';

  public async run(): Promise<void> {
    const {flags} = await this.parse(ItemsCreate);

    // Safely access args with proper typing
    const args = this.args as ItemsCommandArgs;
    const {collection} = args;

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
    const sdkCommand = createItem(
      collection as never,
      itemData as never,
      query as never,
    ) as unknown as SdkRestCommand<unknown>;

    const result = await this.client.request(sdkCommand);

    // Handle response format
    const data = (result as {data?: unknown}).data ?? result;

    this.outputFormatted(data);
  }
}
