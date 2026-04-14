import {deleteRelation} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Delete a relation.
 */
export default class RelationsDelete extends BaseCommand<typeof RelationsDelete> {
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
  static override description = 'Delete a relation between collections';
  static override examples = [
    '<%= config.bin %> <%= command.id %> cases assigned_to',
    '<%= config.bin %> <%= command.id %> cases assigned_to --yes',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    yes: Flags.boolean({
      char: 'y',
      default: false,
      description: 'Skip confirmation prompt',
    }),
  };
  static override summary = 'Delete relation';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(RelationsDelete);

    if (!flags.yes) {
      const confirmed = await this.confirm(`Are you sure you want to delete the relation on "${args.collection}.${args.field}"? (yes/no)`);
      if (!confirmed) {
        this.log('Cancelled.');
        return;
      }
    }

    const sdkCommand = deleteRelation(args.collection, args.field) as unknown as SdkRestCommand<void>;
    await this.client.request(sdkCommand);

    this.log(`Relation on "${args.collection}.${args.field}" deleted successfully.`);
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
