import {readUser} from '@directus/sdk';
import {Args} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Get a single user by ID.
 */
export default class UsersGet extends BaseCommand<typeof UsersGet> {
  static override args = {
    id: Args.string({
      description: 'User ID',
      required: true,
    }),
  };
  static override description = 'Get a user by ID';
  static override examples = ['<%= config.bin %> <%= command.id %> <user-id>'];
  static override flags = {
    ...BaseCommand.baseFlags,
  };
  static override summary = 'Get user';

  public async run(): Promise<void> {
    const {args} = await this.parse(UsersGet);

    const sdkCommand = readUser(args.id) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
