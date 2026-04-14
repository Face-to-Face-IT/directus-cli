import {createUser} from '@directus/sdk';
import {Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Create a new user.
 */
export default class UsersCreate extends BaseCommand<typeof UsersCreate> {
  static override args = {};
  static override description = 'Create a new user in the Directus instance';
  static override examples = [
    '<%= config.bin %> <%= command.id %> --email user@example.com --role <role-id>',
    '<%= config.bin %> <%= command.id %> --email user@example.com --password secret123 --role <role-id>',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    email: Flags.string({
      char: 'e',
      description: 'Email address',
      required: true,
    }),
    firstName: Flags.string({
      description: 'First name',
      helpValue: '<name>',
    }),
    lastName: Flags.string({
      description: 'Last name',
      helpValue: '<name>',
    }),
    password: Flags.string({
      char: 'p',
      description: 'Password',
      helpValue: '<password>',
    }),
    role: Flags.string({
      char: 'r',
      description: 'Role ID',
      required: true,
    }),
  };
  static override summary = 'Create user';

  public async run(): Promise<void> {
    const {flags} = await this.parse(UsersCreate);

    const userData: Record<string, unknown> = {
      email: flags.email,
      role: flags.role,
    };

    // eslint-disable-next-line camelcase
    if (flags.firstName) userData.first_name = flags.firstName;
    // eslint-disable-next-line camelcase
    if (flags.lastName) userData.last_name = flags.lastName;
    if (flags.password) userData.password = flags.password;

    const sdkCommand = createUser(userData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
