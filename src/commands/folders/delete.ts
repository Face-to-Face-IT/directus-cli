import {deleteFolder} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Delete a folder.
 */
export default class FoldersDelete extends BaseCommand<typeof FoldersDelete> {
  static override args = {
    id: Args.string({
      description: 'Folder ID',
      required: true,
    }),
  };
  static override description = 'Delete a folder from the file library';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <folder-id>',
    '<%= config.bin %> <%= command.id %> <folder-id> --yes',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    yes: Flags.boolean({
      char: 'y',
      default: false,
      description: 'Skip confirmation prompt',
    }),
  };
  static override summary = 'Delete folder';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(FoldersDelete);

    if (!flags.yes) {
      const confirmed = await this.confirm(`Are you sure you want to delete folder "${args.id}"? This will move files to the root folder. (yes/no)`);
      if (!confirmed) {
        this.log('Cancelled.');
        return;
      }
    }

    const sdkCommand = deleteFolder(args.id) as unknown as SdkRestCommand<void>;
    await this.client.request(sdkCommand);

    this.log(`Folder "${args.id}" deleted successfully.`);
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
