import {updateUser} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Update an existing user.
 */
export default class UsersUpdate extends BaseCommand<typeof UsersUpdate> {
  static override args = {
    id: Args.string({
      description: 'User ID',
      required: true,
    }),
  };
  static override description = 'Update a user in the Directus instance';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <user-id> --email new@example.com',
    '<%= config.bin %> <%= command.id %> <user-id> --role <new-role-id>',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    email: Flags.string({
      char: 'e',
      description: 'Email address',
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
    }),
    status: Flags.string({
      description: 'User status',
      options: ['active', 'invited', 'draft', 'suspended', 'deleted', 'archived'],
    }),
  };
  static override summary = 'Update user';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(UsersUpdate);

    const userData: Record<string, unknown> = {};

    if (flags.email) userData.email = flags.email;
    // eslint-disable-next-line camelcase
    if (flags.firstName) userData.first_name = flags.firstName;
    // eslint-disable-next-line camelcase
    if (flags.lastName) userData.last_name = flags.lastName;
    if (flags.password) userData.password = flags.password;
    if (flags.role) userData.role = flags.role;
    if (flags.status) userData.status = flags.status;

    if (Object.keys(userData).length === 0) {
      this.error('At least one field to update must be provided');
    }

    const sdkCommand = updateUser(args.id, userData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
