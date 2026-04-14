import {updateRole} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Update an existing role.
 */
export default class RolesUpdate extends BaseCommand<typeof RolesUpdate> {
  static override args = {
    id: Args.string({
      description: 'Role ID',
      required: true,
    }),
  };
  static override description = 'Update a role in the Directus instance';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <role-id> --name "New Name"',
    '<%= config.bin %> <%= command.id %> <role-id> --admin-access',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    adminAccess: Flags.boolean({
      description: 'Grant admin access to this role',
    }),
    appAccess: Flags.boolean({
      description: 'Grant app access to this role',
    }),
    description: Flags.string({
      char: 'd',
      description: 'Role description',
      helpValue: '<description>',
    }),
    icon: Flags.string({
      description: 'Role icon',
    }),
    name: Flags.string({
      char: 'n',
      description: 'Role name',
    }),
  };
  static override summary = 'Update role';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(RolesUpdate);

    const roleData: Record<string, unknown> = {};

    if (flags.name) roleData.name = flags.name;
    if (flags.icon) roleData.icon = flags.icon;
    if (flags.description) roleData.description = flags.description;
    // eslint-disable-next-line camelcase
    if (flags.adminAccess !== undefined) roleData.admin_access = flags.adminAccess;
    // eslint-disable-next-line camelcase
    if (flags.appAccess !== undefined) roleData.app_access = flags.appAccess;

    if (Object.keys(roleData).length === 0) {
      this.error('At least one field to update must be provided');
    }

    const sdkCommand = updateRole(args.id, roleData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
