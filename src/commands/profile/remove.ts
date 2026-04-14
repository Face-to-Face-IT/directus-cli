import {Args, Command} from '@oclif/core';

import {loadConfig, removeProfile} from '../../lib/config.js';

/**
 * Remove a connection profile.
 */
export default class ProfileRemove extends Command {
  static override args = {
    name: Args.string({
      description: 'Profile name',
      required: true,
    }),
  };
  static override description = 'Remove a named connection profile';
  static override examples = ['<%= config.bin %> <%= command.id %> dev'];
  static override summary = 'Remove a profile';

  public async run(): Promise<void> {
    const {args} = await this.parse(ProfileRemove);
    const config = loadConfig();

    if (!config.profiles[args.name]) {
      this.error(`Profile "${args.name}" does not exist.`);
    }

    removeProfile(args.name);
    this.log(`Profile "${args.name}" removed successfully.`);
  }
}
