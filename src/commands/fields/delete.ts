import {deleteField} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Delete a field from a collection.
 */
export default class FieldsDelete extends BaseCommand<typeof FieldsDelete> {
  static override args = {
    collection: Args.string({
      description: 'Collection name',
      required: true,
    }),
    field: Args.string({
      description: 'Field name',
      required: true,
    }),
  };
  static override description = 'Delete a field from a collection';
  static override examples = [
    '<%= config.bin %> <%= command.id %> old_collection unused_field',
    '<%= config.bin %> <%= command.id %> posts temp_field --yes',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    yes: Flags.boolean({
      char: 'y',
      default: false,
      description: 'Skip confirmation prompt',
    }),
  };
  static override summary = 'Delete field';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(FieldsDelete);

    if (!flags.yes) {
      const confirmed = await this.confirm(`Are you sure you want to delete field "${args.field}" from collection "${args.collection}"? This action cannot be undone. (yes/no)`);
      if (!confirmed) {
        this.log('Cancelled.');
        return;
      }
    }

    const sdkCommand = deleteField(args.collection, args.field) as unknown as SdkRestCommand<void>;
    await this.client.request(sdkCommand);

    this.log(`Field "${args.field}" deleted from collection "${args.collection}".`);
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
