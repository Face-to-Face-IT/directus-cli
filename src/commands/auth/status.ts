import {readMe} from '@directus/sdk';
import {Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Show current authentication status.
 */
export default class AuthStatus extends BaseCommand<typeof AuthStatus> {
  static override description = 'Display the current authentication status and user info';
  static override examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> -p prod'];
  static override flags = {
    ...BaseCommand.baseFlags,
    profile: Flags.string({
      char: 'p',
      description: 'Profile to check',
    }),
  };
  static override summary = 'Show auth status';

  public async run(): Promise<void> {
    await this.parse(AuthStatus);

    try {
      // Create SDK command - cast through unknown to handle schema typing
      const sdkCommand = readMe() as unknown as SdkRestCommand<unknown>;
      const me = await this.client.request(sdkCommand);
      this.outputFormatted(me);
    } catch {
      this.log('Not authenticated.');
    }
  }
}
