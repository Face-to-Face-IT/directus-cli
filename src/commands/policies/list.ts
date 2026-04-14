import {readPolicies} from '@directus/sdk';
import {Flags} from '@oclif/core';

import type {Filter} from '../../lib/filter.js';
import type {SdkQuery, SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';
import {combineFilters, parseFields, parseSort} from '../../lib/filter.js';

/**
 * List access policies in the Directus instance (Directus 11+).
 */
export default class PoliciesList extends BaseCommand<typeof PoliciesList> {
  static override args = {};
  static override description = 'List access policies in the Directus instance (Directus 11+)';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --role <role-id>',
    '<%= config.bin %> <%= command.id %> --user <user-id>',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    fields: Flags.string({
      char: 'f',
      description: 'Comma-separated fields to retrieve',
      helpValue: '<fields>',
    }),
    limit: Flags.integer({
      char: 'l',
      default: 100,
      description: 'Maximum policies to return',
    }),
    role: Flags.string({
      char: 'r',
      description: 'Filter by role ID',
      helpValue: '<role-id>',
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
  static override summary = 'List policies';

  public async run(): Promise<void> {
    const {flags} = await this.parse(PoliciesList);

    const fields = flags.fields ? parseFields(flags.fields) : undefined;
    const sort = flags.sort ? parseSort(flags.sort) : undefined;

    const filters: Filter[] = [];
    if (flags.role) filters.push({role: {_eq: flags.role}});
    if (flags.user) filters.push({user: {_eq: flags.user}});

    const filter = combineFilters(filters);

    const query: SdkQuery = {};
    if (fields) query.fields = fields;
    if (filter) query.filter = filter;
    if (sort) query.sort = sort;
    if (flags.limit !== undefined) query.limit = flags.limit;

    const sdkCommand = readPolicies(query as never) as unknown as SdkRestCommand<unknown[]>;
    const result = await this.client.request(sdkCommand);

    const data = Array.isArray(result) ? result : ((result as {data?: unknown[]}).data ?? []);
    this.outputFormatted(data);
  }
}
