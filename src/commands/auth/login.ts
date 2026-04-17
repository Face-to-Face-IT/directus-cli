import {Command, Flags} from '@oclif/core';

import {loginAndStoreTokens} from '../../lib/auth.js';

/**
 * Login to a Directus instance.
 */
export default class AuthLogin extends Command {
  static override description = 'Authenticate with email/password and store tokens';
  static override examples = [
    '<%= config.bin %> <%= command.id %> --email admin@example.com --password secret',
    '<%= config.bin %> <%= command.id %> -p dev --email admin@example.com --password secret',
  ];
  static override flags = {
    email: Flags.string({
      char: 'e',
      description: 'Email address',
      required: true,
    }),
    password: Flags.string({
      char: 'w',
      description: 'Password',
      required: true,
    }),
    profile: Flags.string({
      char: 'p',
      default: 'default',
      description: 'Profile to authenticate',
    }),
    url: Flags.string({
      description: 'Directus URL (overrides profile)',
    }),
  };
  static override summary = 'Login to Directus';

  public async run(): Promise<void> {
    const {flags} = await this.parse(AuthLogin);

    await loginAndStoreTokens(flags.profile, flags.email, flags.password, flags.url);

    this.log(`Successfully logged in to profile "${flags.profile}".`);
  }
}
