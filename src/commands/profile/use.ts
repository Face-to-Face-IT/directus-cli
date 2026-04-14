import {Args, Command} from '@oclif/core';

import {loadConfig, setDefaultProfile} from '../../lib/config.js';

/**
 * Set the default profile.
 */
export default class ProfileUse extends Command {
  static override args = {
    name: Args.string({
      description: 'Profile name',
      required: true,
    }),
  };
  static override description = 'Set the default profile to use when none is specified';
  static override examples = ['<%= config.bin %> <%= command.id %> prod'];
  static override summary = 'Set default profile';

  public async run(): Promise<void> {
    const {args} = await this.parse(ProfileUse);
    const config = loadConfig();

    if (!config.profiles[args.name]) {
      this.error(`Profile "${args.name}" does not exist.`);
    }

    setDefaultProfile(args.name);
    this.log(`Default profile set to "${args.name}".`);
  }
}
