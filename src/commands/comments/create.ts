import {createComment} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Create a new comment.
 */
export default class CommentsCreate extends BaseCommand<typeof CommentsCreate> {
  static override args = {
    collection: Args.string({
      description: 'Collection name',
      required: true,
    }),
    item: Args.string({
      description: 'Item ID',
      required: true,
    }),
  };
  static override description = 'Create a new comment on an item';
  static override examples = [
    '<%= config.bin %> <%= command.id %> cases <item-id> --comment "This is a comment"',
    '<%= config.bin %> <%= command.id %> posts <item-id> --comment "Great post!"',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    comment: Flags.string({
      char: 'c',
      description: 'Comment text',
      required: true,
    }),
  };
  static override summary = 'Create comment';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(CommentsCreate);

    const commentData = {
      collection: args.collection,
      comment: flags.comment,
      item: args.item,
    };

    const sdkCommand = createComment(commentData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
