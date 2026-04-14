import {updateFolder} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Update an existing folder.
 */
export default class FoldersUpdate extends BaseCommand<typeof FoldersUpdate> {
  static override args = {
    id: Args.string({
      description: 'Folder ID',
      required: true,
    }),
  };
  static override description = 'Update a folder';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <folder-id> --name "New Name"',
    '<%= config.bin %> <%= command.id %> <folder-id> --parent <new-parent-id>',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'New folder name',
    }),
    parent: Flags.string({
      char: 'p',
      description: 'Parent folder ID',
      helpValue: '<folder-id>',
    }),
  };
  static override summary = 'Update folder';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(FoldersUpdate);

    const folderData: Record<string, unknown> = {};

    if (flags.name) folderData.name = flags.name;
    if (flags.parent !== undefined) folderData.parent = flags.parent;

    if (Object.keys(folderData).length === 0) {
      this.error('At least one field to update must be provided');
    }

    const sdkCommand = updateFolder(args.id, folderData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
