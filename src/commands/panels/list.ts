import {readPanels} from '@directus/sdk';
import {Flags} from '@oclif/core';

import type {Filter} from '../../lib/filter.js';
import type {SdkQuery, SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';
import {
  combineFilters, parseFields, parseFilterExpression, parseSort,
} from '../../lib/filter.js';

/**
 * List panels in the Directus instance.
 */
export default class PanelsList extends BaseCommand<typeof PanelsList> {
  static override args = {};
  static override description = 'List dashboard panels';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --dashboard <dashboard-id>',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    dashboard: Flags.string({
      char: 'd',
      description: 'Filter by dashboard ID',
      helpValue: '<dashboard-id>',
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
      description: 'Maximum panels to return',
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
  };
  static override summary = 'List panels';

  public async run(): Promise<void> {
    const {flags} = await this.parse(PanelsList);

    const fields = flags.fields ? parseFields(flags.fields) : undefined;
    const sort = flags.sort ? parseSort(flags.sort) : undefined;

    const filters: Filter[] = [];
    if (flags.filter) {
      for (const filterStr of flags.filter) {
        filters.push(parseFilterExpression(filterStr));
      }
    }

    if (flags.dashboard) {
      filters.push({dashboard: {_eq: flags.dashboard}});
    }

    const filter = combineFilters(filters);

    const query: SdkQuery = {};
    if (fields) query.fields = fields;
    if (filter) query.filter = filter;
    if (sort) query.sort = sort;
    if (flags.limit !== undefined) query.limit = flags.limit;
    if (flags.offset !== undefined) query.offset = flags.offset;

    const sdkCommand = readPanels(query as never) as unknown as SdkRestCommand<unknown[]>;
    const result = await this.client.request(sdkCommand);

    const data = Array.isArray(result) ? result : ((result as {data?: unknown[]}).data ?? []);
    const {meta} = result as {meta?: {filter_count?: number; total_count?: number}};

    this.outputFormatted(data, {
      filterCount: meta?.filter_count,
      totalCount: meta?.total_count,
    });
  }
}
