import {deleteComment} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Delete a comment.
 */
export default class CommentsDelete extends BaseCommand<typeof CommentsDelete> {
  static override args = {
    id: Args.string({
      description: 'Comment ID',
      required: true,
    }),
  };
  static override description = 'Delete a comment';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <comment-id>',
    '<%= config.bin %> <%= command.id %> <comment-id> --yes',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    yes: Flags.boolean({
      char: 'y',
      default: false,
      description: 'Skip confirmation prompt',
    }),
  };
  static override summary = 'Delete comment';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(CommentsDelete);

    if (!flags.yes) {
      const confirmed = await this.confirm(`Are you sure you want to delete comment "${args.id}"? (yes/no)`);
      if (!confirmed) {
        this.log('Cancelled.');
        return;
      }
    }

    const sdkCommand = deleteComment(args.id) as unknown as SdkRestCommand<void>;
    await this.client.request(sdkCommand);

    this.log(`Comment "${args.id}" deleted successfully.`);
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
