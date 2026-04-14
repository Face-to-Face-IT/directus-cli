import {readPermissions} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * List permissions in the Directus instance.
 */
export default class PermissionsList extends BaseCommand<typeof PermissionsList> {
  static override args = {
    collection: Args.string({
      description: 'Filter by collection name',
      required: false,
    }),
  };
  static override description = 'List permissions in the Directus instance';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> cases',
    '<%= config.bin %> <%= command.id %> --role <role-id>',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    role: Flags.string({
      description: 'Filter by role ID',
      helpValue: '<role-id>',
    }),
  };
  static override summary = 'List permissions';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PermissionsList);

    const query: Record<string, unknown> = {};
    if (args.collection) query.filter = {collection: {_eq: args.collection}};
    if (flags.role) query.filter = {...(query.filter as Record<string, unknown>), role: {_eq: flags.role}};

    const sdkCommand = readPermissions(query as never) as unknown as SdkRestCommand<unknown[]>;
    const result = await this.client.request(sdkCommand);

    const data = Array.isArray(result) ? result : ((result as {data?: unknown[]}).data ?? []);
    this.outputFormatted(data);
  }
}
