import {deleteCollection} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Delete a collection.
 */
export default class CollectionsDelete extends BaseCommand<typeof CollectionsDelete> {
  static override args = {
    name: Args.string({
      description: 'Collection name',
      required: true,
    }),
  };
  static override description = 'Delete a collection';
  static override examples = [
    '<%= config.bin %> <%= command.id %> old_collection',
    '<%= config.bin %> <%= command.id %> old_collection --yes',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    yes: Flags.boolean({
      char: 'y',
      default: false,
      description: 'Skip confirmation prompt',
    }),
  };
  static override summary = 'Delete collection';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(CollectionsDelete);

    if (!flags.yes) {
      const confirmed = await this.confirm(`Are you sure you want to delete collection "${args.name}"? This will delete all items in the collection. (yes/no)`);
      if (!confirmed) {
        this.log('Cancelled.');
        return;
      }
    }

    const sdkCommand = deleteCollection(args.name as never) as unknown as SdkRestCommand<void>;
    await this.client.request(sdkCommand);

    this.log(`Collection "${args.name}" deleted successfully.`);
  }

  private async confirm(prompt: string): Promise<boolean> {
    const response = await new Promise<string>(resolve => {
      process.stdout.write(prompt + ' ');
      process.stdin.once('data', data => {
        resolve(data.toString().trim().toLowerCase());
      });
    });
    return response === 'yes' || response === 'y';
  }
}
