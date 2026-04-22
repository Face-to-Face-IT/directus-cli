import {Command, Flags} from '@oclif/core';

import {refreshAndStoreTokensDetailed, type RefreshFailureReason} from '../../lib/auth.js';

const FAILURE_MESSAGES: Record<RefreshFailureReason, string> = {
  missingProfile:
    'Profile "{profile}" does not exist. Create it with: directus-cli profile add {profile} <url>',
  missingRefreshToken:
    'Profile "{profile}" has no stored refresh token. Log in again with: '
    + 'directus-cli auth login --profile {profile} --email <email> --password-stdin '
    + '(or --password <password> for interactive use).',
  networkError:
    'Could not reach the Directus server to refresh the token for profile "{profile}". '
    + 'Check connectivity and try again.',
  rejected:
    'The refresh token for profile "{profile}" was rejected by the server. '
    + 'It may have expired or been revoked (e.g. logged out elsewhere, password changed). '
    + 'Log in again with: directus-cli auth login --profile {profile} --email <email> --password-stdin '
    + '(or --password <password> for interactive use).',
  unknown: 'Failed to refresh token for profile "{profile}". Try logging in again.',
};

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

    const result = await refreshAndStoreTokensDetailed(flags.profile);

    if (result.ok) {
      this.log(`Successfully refreshed token for profile "${flags.profile}".`);
      return;
    }

    const template = FAILURE_MESSAGES[result.reason];
    const message = template.replaceAll('{profile}', flags.profile);
    const detail = result.detail ? `\n  Detail: ${result.detail}` : '';
    this.error(`${message}${detail}`);
  }
}
