import {readCollections} from '@directus/sdk';
import {Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * List all collections in the Directus instance.
 */
export default class CollectionsList extends BaseCommand<typeof CollectionsList> {
  static override description = 'List all collections in the Directus instance';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -p prod',
    '<%= config.bin %> <%= command.id %> --names-only',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    'names-only': Flags.boolean({
      default: false,
      description: 'Return only collection names as a flat array',
    }),
  };
  static override summary = 'List collections';

  public async run(): Promise<void> {
    const {flags} = await this.parse(CollectionsList);
    const sdkCommand = readCollections() as unknown as SdkRestCommand<unknown[]>;
    const result = await this.client.request(sdkCommand);

    const collections = Array.isArray(result) ? result : ((result as {data?: unknown[]}).data ?? []);

    if (flags['names-only']) {
      // Extract just the collection names for display
      const collectionNames = collections
      .map((c: unknown) => {
        const collection = c as {collection?: string};
        return collection.collection;
      })
      .filter(Boolean);
      this.outputFormatted(collectionNames);
    } else {
      this.outputFormatted(collections);
    }
  }
}
