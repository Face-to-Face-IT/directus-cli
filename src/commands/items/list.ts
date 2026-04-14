import {readItems} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {Filter} from '../../lib/filter.js';
import type {ItemsCommandArgs, SdkQuery, SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';
import {
  combineFilters, parseFields, parseFilterExpression, parseSort,
} from '../../lib/filter.js';

/**
 * List items in a collection.
 */
export default class ItemsList extends BaseCommand<typeof ItemsList> {
  static override args = {
    collection: Args.string({
      description: 'Collection name',
      required: true,
    }),
  };
  static override description = 'List items in a Directus collection';
  static override examples = [
    '<%= config.bin %> <%= command.id %> posts',
    '<%= config.bin %> <%= command.id %> posts --fields id,title --limit 10',
    '<%= config.bin %> <%= command.id %> posts --filter status=published',
    String.raw`<%= config.bin %> <%= command.id %> posts --filter '{"status":{"_eq":"published"}}'`,
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    fields: Flags.string({
      char: 'f',
      description: 'Comma-separated fields to retrieve',
      helpValue: '<fields>',
    }),
    filter: Flags.string({
      description: 'Filter expression (field=value or JSON)',
      helpValue: '<filter>',
      multiple: true,
    }),
    limit: Flags.integer({
      char: 'l',
      default: 100,
      description: 'Maximum items to return',
    }),
    meta: Flags.string({
      description: 'Include metadata (total_count,filter_count)',
      options: ['total_count', 'filter_count', '*'],
    }),
    offset: Flags.integer({
      char: 'o',
      default: 0,
      description: 'Pagination offset',
    }),
    page: Flags.integer({
      char: 'p',
      description: 'Page number (alternative to offset)',
    }),
    search: Flags.string({
      description: 'Full-text search query',
      helpValue: '<query>',
    }),
    sort: Flags.string({
      char: 's',
      description: 'Sort fields (-field for descending)',
      helpValue: '<fields>',
    }),
  };
  static override summary = 'List items';

  public async run(): Promise<void> {
    const {flags} = await this.parse(ItemsList);

    // Safely access args with proper typing
    const args = this.args as ItemsCommandArgs;
    const {collection} = args;

    // Build query
    const fields = flags.fields ? parseFields(flags.fields) : undefined;
    const sort = flags.sort ? parseSort(flags.sort) : undefined;

    // Parse filters
    const filters: Filter[] = [];
    if (flags.filter) {
      for (const filterStr of flags.filter) {
        filters.push(parseFilterExpression(filterStr));
      }
    }

    const filter = combineFilters(filters);

    // Calculate offset from page if provided
    let {offset} = flags;
    if (flags.page !== undefined) {
      offset = (flags.page - 1) * flags.limit;
    }

    // Build SDK query
    const query: SdkQuery = {};
    if (fields) query.fields = fields;
    if (filter) query.filter = filter;
    if (sort) query.sort = sort;
    if (flags.limit !== undefined) query.limit = flags.limit;
    if (offset !== undefined) query.offset = offset;
    if (flags.search) query.search = flags.search;
    if (flags.meta) query.meta = flags.meta;

    // Create SDK command - cast through unknown to handle schema typing
    const sdkCommand = readItems(collection as never, query as never) as unknown as SdkRestCommand<unknown[]>;

    try {
      const result = await this.client.request(sdkCommand);

      // Handle response format - SDK returns data directly or wrapped
      const data = Array.isArray(result) ? result : ((result as {data?: unknown[]}).data ?? []);
      const {meta} = result as {meta?: {filter_count?: number; total_count?: number}};

      this.outputFormatted(data, {
        filterCount: meta?.filter_count,
        totalCount: meta?.total_count,
      });
    } catch (error) {
      // Log error details for debugging
      if (this.flags.verbose) {
        console.error('DEBUG ERROR:', JSON.stringify(error, null, 2));
      }

      throw error;
    }
  }
}
