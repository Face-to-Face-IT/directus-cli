import {Command, Flags} from '@oclif/core';

import {logoutAndClearTokens} from '../../lib/auth.js';

/**
 * Logout from a Directus instance.
 */
export default class AuthLogout extends Command {
  static override description = 'Invalidate the current session and clear stored tokens';
  static override examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> -p prod'];
  static override flags = {
    profile: Flags.string({
      char: 'p',
      default: 'default',
      description: 'Profile to logout from',
    }),
  };
  static override summary = 'Logout from Directus';

  public async run(): Promise<void> {
    const {flags} = await this.parse(AuthLogout);

    await logoutAndClearTokens(flags.profile);

    this.log(`Successfully logged out from profile "${flags.profile}".`);
  }
}
