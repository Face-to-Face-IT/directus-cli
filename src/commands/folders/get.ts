import {readFolder} from '@directus/sdk';
import {Args} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Get a folder by ID.
 */
export default class FoldersGet extends BaseCommand<typeof FoldersGet> {
  static override args = {
    id: Args.string({
      description: 'Folder ID',
      required: true,
    }),
  };
  static override description = 'Get a folder by ID';
  static override examples = ['<%= config.bin %> <%= command.id %> <folder-id>'];
  static override flags = {
    ...BaseCommand.baseFlags,
  };
  static override summary = 'Get folder';

  public async run(): Promise<void> {
    const {args} = await this.parse(FoldersGet);

    const sdkCommand = readFolder(args.id) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
