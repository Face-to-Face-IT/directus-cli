import {readFields} from '@directus/sdk';
import {Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * List fields for a collection.
 */
export default class FieldsList extends BaseCommand<typeof FieldsList> {
  static override args = {};
  static override description = 'List fields for a collection';
  static override examples = [
    '<%= config.bin %> <%= command.id %> --collection cases',
    '<%= config.bin %> <%= command.id %> --collection cases --fields field,collection,type',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    collection: Flags.string({
      char: 'c',
      description: 'Collection name',
      required: true,
    }),
  };
  static override summary = 'List fields';

  public async run(): Promise<void> {
    const sdkCommand = readFields() as unknown as SdkRestCommand<unknown[]>;
    const result = await this.client.request(sdkCommand);

    const data = Array.isArray(result) ? result : ((result as {data?: unknown[]}).data ?? []);
    this.outputFormatted(data);
  }
}
