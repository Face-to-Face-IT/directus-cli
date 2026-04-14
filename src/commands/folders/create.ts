import {createFolder} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Create a new folder.
 */
export default class FoldersCreate extends BaseCommand<typeof FoldersCreate> {
  static override args = {
    name: Args.string({
      description: 'Folder name',
      required: true,
    }),
  };
  static override description = 'Create a new folder in the file library';
  static override examples = [
    '<%= config.bin %> <%= command.id %> "My Documents"',
    '<%= config.bin %> <%= command.id %> "Subfolder" --parent <folder-id>',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    parent: Flags.string({
      char: 'p',
      description: 'Parent folder ID',
      helpValue: '<folder-id>',
    }),
  };
  static override summary = 'Create folder';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(FoldersCreate);

    const folderData: Record<string, unknown> = {
      name: args.name,
    };

    if (flags.parent) folderData.parent = flags.parent;

    const sdkCommand = createFolder(folderData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
