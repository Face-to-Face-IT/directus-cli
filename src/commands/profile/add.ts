import {Args, Command, Flags} from '@oclif/core';

import {setDefaultProfile, setProfile} from '../../lib/config.js';

/**
 * Add a new connection profile.
 */
export default class ProfileAdd extends Command {
  static override args = {
    name: Args.string({
      description: 'Profile name',
      required: true,
    }),
    url: Args.string({
      description: 'Directus instance URL',
      required: true,
    }),
  };
  static override description = 'Add a named connection profile for a Directus instance';
  static override examples = ['<%= config.bin %> <%= command.id %> dev https://api.example.com'];
  static override flags = {
    default: Flags.boolean({
      char: 'd',
      default: false,
      description: 'Set as default profile',
    }),
    token: Flags.string({
      char: 't',
      description: 'Static access token',
      helpValue: '<token>',
    }),
  };
  static override summary = 'Add a new profile';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ProfileAdd);

    setProfile(args.name, {
      token: flags.token,
      url: args.url,
    });

    if (flags.default) {
      setDefaultProfile(args.name);
    }

    this.log(`Profile "${args.name}" added successfully.`);
  }
}
