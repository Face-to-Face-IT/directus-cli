import {readCollections} from '@directus/sdk';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * List all collections in the Directus instance.
 */
export default class CollectionsList extends BaseCommand<typeof CollectionsList> {
  static override description = 'List all collections in the Directus instance';
  static override examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> -p prod'];
  static override flags = {
    ...BaseCommand.baseFlags,
  };
  static override summary = 'List collections';

  public async run(): Promise<void> {
    const sdkCommand = readCollections() as unknown as SdkRestCommand<unknown[]>;
    const result = await this.client.request(sdkCommand);

    // Extract just the collection names for display
    const collections = Array.isArray(result) ? result : ((result as {data?: unknown[]}).data ?? []);
    const collectionNames = collections
    .map((c: unknown) => {
      const collection = c as {collection?: string};
      return collection.collection;
    })
    .filter(Boolean);

    this.outputFormatted(collectionNames);
  }
}
