import {utilsExport} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Export data from a collection.
 */
export default class ExportCommand extends BaseCommand<typeof ExportCommand> {
  static override args = {
    collection: Args.string({
      description: 'Collection to export from',
      required: true,
    }),
  };
  static override description = 'Export data from a collection (saves to Directus file library)';
  static override examples = [
    '<%= config.bin %> <%= command.id %> cases --format json',
    '<%= config.bin %> <%= command.id %> users --format csv --filter \'{"role":{"_eq":"admin"}}\'',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    filter: Flags.string({
      description: 'JSON filter query',
      helpValue: '<json>',
    }),
    format: Flags.string({
      char: 'f',
      default: 'json',
      description: 'Export format',
      options: ['csv', 'json', 'xml', 'yaml'],
    }),
  };
  static override summary = 'Export data';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ExportCommand);

    const query: Record<string, unknown> = {};
    if (flags.filter) {
      try {
        query.filter = JSON.parse(flags.filter);
      } catch {
        this.error('Invalid JSON filter');
      }
    }

    // utilsExport takes: collection, format, query, file
    // Returns a file ID in the Directus file library
    const sdkCommand = utilsExport(
      args.collection as never,
      flags.format as never,
      query as never,
      {},
    ) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.log('Export saved to file library:');
    this.outputFormatted(data);
  }
}
