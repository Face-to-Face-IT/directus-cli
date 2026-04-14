import {updateComment} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Update an existing comment.
 */
export default class CommentsUpdate extends BaseCommand<typeof CommentsUpdate> {
  static override args = {
    id: Args.string({
      description: 'Comment ID',
      required: true,
    }),
  };
  static override description = 'Update a comment';
  static override examples = ['<%= config.bin %> <%= command.id %> <comment-id> --comment "Updated comment text"'];
  static override flags = {
    ...BaseCommand.baseFlags,
    comment: Flags.string({
      char: 'c',
      description: 'Updated comment text',
      required: true,
    }),
  };
  static override summary = 'Update comment';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(CommentsUpdate);

    const commentData = {
      comment: flags.comment,
    };

    const sdkCommand = updateComment(args.id, commentData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
