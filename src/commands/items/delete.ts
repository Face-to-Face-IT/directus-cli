import {deleteItem} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {ItemsCommandArgs, SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Delete an item from a collection.
 */
export default class ItemsDelete extends BaseCommand<typeof ItemsDelete> {
  static override args = {
    collection: Args.string({
      description: 'Collection name',
      required: true,
    }),
    id: Args.string({
      description: 'Item ID',
      required: true,
    }),
  };
  static override description = 'Delete an item from a Directus collection';
  static override examples = [
    '<%= config.bin %> <%= command.id %> posts 1',
    '<%= config.bin %> <%= command.id %> posts 1 --yes',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    yes: Flags.boolean({
      char: 'y',
      default: false,
      description: 'Skip confirmation prompt',
    }),
  };
  static override summary = 'Delete an item';

  public async run(): Promise<void> {
    const {flags} = await this.parse(ItemsDelete);

    // Safely access args with proper typing
    const args = this.args as ItemsCommandArgs;
    const {collection, id} = args;

    if (!flags.yes) {
      const confirmed = await this.confirm(`Are you sure you want to delete item ${id} from ${collection}? (yes/no)`);
      if (!confirmed) {
        this.log('Cancelled.');
        return;
      }
    }

    // Create SDK command - cast through unknown to handle schema typing
    const sdkCommand = deleteItem(collection as never, id as never) as unknown as SdkRestCommand<void>;

    await this.client.request(sdkCommand);

    this.log(`Item ${id} deleted from ${collection}.`);
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
