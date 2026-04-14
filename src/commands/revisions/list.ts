import {readRevisions} from '@directus/sdk';
import {Flags} from '@oclif/core';

import type {SdkQuery, SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * List revisions (change history) for an item.
 */
export default class RevisionsList extends BaseCommand<typeof RevisionsList> {
  static override args = {};
  static override description = 'List revisions (change history)';
  static override examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> --limit 10'];
  static override flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({
      char: 'l',
      default: 100,
      description: 'Maximum revisions to return',
    }),
  };
  static override summary = 'List revisions';

  public async run(): Promise<void> {
    const {flags} = await this.parse(RevisionsList);

    const query: SdkQuery = {limit: flags.limit};

    const sdkCommand = readRevisions(query as never) as unknown as SdkRestCommand<unknown[]>;
    const result = await this.client.request(sdkCommand);

    const data = Array.isArray(result) ? result : ((result as {data?: unknown[]}).data ?? []);
    this.outputFormatted(data);
  }
}
