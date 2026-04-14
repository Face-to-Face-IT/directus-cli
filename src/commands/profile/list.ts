import {Command} from '@oclif/core';

import {loadConfig} from '../../lib/config.js';

/**
 * List all configured profiles.
 */
export default class ProfileList extends Command {
  static override description = 'List all configured Directus connection profiles';
  static override examples = ['<%= config.bin %> <%= command.id %>'];
  static override summary = 'List profiles';

  public async run(): Promise<void> {
    await this.parse(ProfileList);
    const config = loadConfig();
    const profiles = Object.entries(config.profiles);

    if (profiles.length === 0) {
      this.log('No profiles configured.');
      this.log('Use "directus-cli profile add <name> <url>" to create a profile.');
      return;
    }

    this.log(`Default profile: ${config.defaultProfile}\n`);
    this.log('Profiles:');

    for (const [name, profile] of profiles) {
      const isDefault = name === config.defaultProfile ? ' (default)' : '';
      const auth = profile.token || profile.accessToken ? ' [authenticated]' : '';
      this.log(`  ${name}${isDefault}:`);
      this.log(`    URL: ${profile.url}${auth}`);
    }
  }
}
