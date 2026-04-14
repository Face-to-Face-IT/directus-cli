import {updateCollection} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Update an existing collection.
 */
export default class CollectionsUpdate extends BaseCommand<typeof CollectionsUpdate> {
  static override args = {
    name: Args.string({
      description: 'Collection name',
      required: true,
    }),
  };
  static override description = 'Update a collection';
  static override examples = [
    '<%= config.bin %> <%= command.id %> posts --note "Blog posts"',
    '<%= config.bin %> <%= command.id %> settings --icon "settings" --singleton',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    icon: Flags.string({
      description: 'Collection icon',
    }),
    note: Flags.string({
      char: 'n',
      description: 'Collection note/description',
      helpValue: '<text>',
    }),
    singleton: Flags.boolean({
      description: 'Set as singleton collection',
    }),
  };
  static override summary = 'Update collection';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(CollectionsUpdate);

    const collectionData: Record<string, unknown> = {};
    const meta: Record<string, unknown> = {};

    if (flags.icon) meta.icon = flags.icon;
    if (flags.note) meta.note = flags.note;
    if (flags.singleton !== undefined) meta.singleton = flags.singleton;

    if (Object.keys(meta).length > 0) {
      collectionData.meta = meta;
    }

    if (Object.keys(collectionData).length === 0) {
      this.error('At least one field to update must be provided');
    }

    const sdkCommand = updateCollection(
      args.name as never,
      collectionData as never,
    ) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
