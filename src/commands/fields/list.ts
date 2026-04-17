import {readFields, readFieldsByCollection} from '@directus/sdk';
import {Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * List fields, optionally filtered by collection.
 */
export default class FieldsList extends BaseCommand<typeof FieldsList> {
  static override args = {};
  static override description = 'List fields for a collection, or all fields across all collections';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --collection cases',
    '<%= config.bin %> <%= command.id %> --collection cases --fields field,collection,type',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    collection: Flags.string({
      char: 'c',
      description: 'Collection name (omit to list all fields across all collections)',
    }),
  };
  static override summary = 'List fields';

  public async run(): Promise<void> {
    const {flags} = await this.parse(FieldsList);

    let result: unknown;
    if (flags.collection) {
      // Fetch fields for a specific collection
      const sdkCommand = readFieldsByCollection(flags.collection) as unknown as SdkRestCommand<unknown[]>;
      result = await this.client.request(sdkCommand);
    } else {
      // Fetch all fields across all collections
      const sdkCommand = readFields() as unknown as SdkRestCommand<unknown[]>;
      result = await this.client.request(sdkCommand);
    }

    const data = Array.isArray(result) ? result : ((result as {data?: unknown[]}).data ?? []);
    this.outputFormatted(data);
  }
}
