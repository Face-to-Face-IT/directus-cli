import {readPresets} from '@directus/sdk';
import {Flags} from '@oclif/core';

import type {Filter} from '../../lib/filter.js';
import type {SdkQuery, SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';
import {
  combineFilters, parseFields, parseFilterExpression, parseSort,
} from '../../lib/filter.js';

/**
 * List presets (bookmark configurations) in the Directus instance.
 */
export default class PresetsList extends BaseCommand<typeof PresetsList> {
  static override args = {};
  static override description = 'List presets (bookmark configurations)';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --collection cases',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    collection: Flags.string({
      char: 'c',
      description: 'Filter by collection name',
      helpValue: '<collection>',
    }),
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
      description: 'Maximum presets to return',
    }),
    offset: Flags.integer({
      char: 'o',
      default: 0,
      description: 'Pagination offset',
    }),
    sort: Flags.string({
      char: 's',
      description: 'Sort fields',
      helpValue: '<fields>',
    }),
    user: Flags.string({
      char: 'u',
      description: 'Filter by user ID',
      helpValue: '<user-id>',
    }),
  };
  static override summary = 'List presets';

  public async run(): Promise<void> {
    const {flags} = await this.parse(PresetsList);

    const fields = flags.fields ? parseFields(flags.fields) : undefined;
    const sort = flags.sort ? parseSort(flags.sort) : undefined;

    const filters: Filter[] = [];
    if (flags.filter) {
      for (const filterStr of flags.filter) {
        filters.push(parseFilterExpression(filterStr));
      }
    }

    if (flags.collection) {
      filters.push({collection: {_eq: flags.collection}});
    }

    if (flags.user) {
      filters.push({user: {_eq: flags.user}});
    }

    const filter = combineFilters(filters);

    const query: SdkQuery = {};
    if (fields) query.fields = fields;
    if (filter) query.filter = filter;
    if (sort) query.sort = sort;
    if (flags.limit !== undefined) query.limit = flags.limit;
    if (flags.offset !== undefined) query.offset = flags.offset;

    const sdkCommand = readPresets(query as never) as unknown as SdkRestCommand<unknown[]>;
    const result = await this.client.request(sdkCommand);

    const data = Array.isArray(result) ? result : ((result as {data?: unknown[]}).data ?? []);
    const {meta} = result as {meta?: {filter_count?: number; total_count?: number}};

    this.outputFormatted(data, {
      filterCount: meta?.filter_count,
      totalCount: meta?.total_count,
    });
  }
}
