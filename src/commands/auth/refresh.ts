import {Command, Flags} from '@oclif/core';

import {refreshAndStoreTokens} from '../../lib/auth.js';

/**
 * Refresh the access token.
 */
export default class AuthRefresh extends Command {
  static override description = 'Refresh the stored access token using the refresh token';
  static override examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> -p prod'];
  static override flags = {
    profile: Flags.string({
      char: 'p',
      default: 'default',
      description: 'Profile to refresh',
    }),
  };
  static override summary = 'Refresh access token';

  public async run(): Promise<void> {
    const {flags} = await this.parse(AuthRefresh);

    const success = await refreshAndStoreTokens(flags.profile);

    if (success) {
      this.log(`Successfully refreshed token for profile "${flags.profile}".`);
      // Force exit: the Directus SDK keeps handles open that prevent clean exit.
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(0);
    } else {
      this.error(`Failed to refresh token for profile "${flags.profile}". Try logging in again.`);
    }
  }
}
