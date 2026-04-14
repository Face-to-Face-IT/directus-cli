import {readComment} from '@directus/sdk';
import {Args} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Get a comment by ID.
 */
export default class CommentsGet extends BaseCommand<typeof CommentsGet> {
  static override args = {
    id: Args.string({
      description: 'Comment ID',
      required: true,
    }),
  };
  static override description = 'Get a comment by ID';
  static override examples = ['<%= config.bin %> <%= command.id %> <comment-id>'];
  static override flags = {
    ...BaseCommand.baseFlags,
  };
  static override summary = 'Get comment';

  public async run(): Promise<void> {
    const {args} = await this.parse(CommentsGet);

    const sdkCommand = readComment(args.id) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
