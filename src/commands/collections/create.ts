import {createCollection} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Create a new collection.
 */
export default class CollectionsCreate extends BaseCommand<typeof CollectionsCreate> {
  static override args = {
    name: Args.string({
      description: 'Collection name',
      required: true,
    }),
  };
  static override description = 'Create a new collection';
  static override examples = [
    '<%= config.bin %> <%= command.id %> new_collection',
    '<%= config.bin %> <%= command.id %> posts --singleton',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    icon: Flags.string({
      default: 'folder',
      description: 'Collection icon',
    }),
    note: Flags.string({
      description: 'Collection note/description',
      helpValue: '<text>',
    }),
    singleton: Flags.boolean({
      default: false,
      description: 'Create as singleton collection',
    }),
  };
  static override summary = 'Create collection';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(CollectionsCreate);

    const collectionData: Record<string, unknown> = {
      collection: args.name,
      meta: {
        icon: flags.icon,
        singleton: flags.singleton,
      },
    };

    if (flags.note) {
      (collectionData.meta as Record<string, unknown>).note = flags.note;
    }

    const sdkCommand = createCollection(collectionData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
