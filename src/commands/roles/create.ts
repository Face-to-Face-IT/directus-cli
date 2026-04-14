import {createRole} from '@directus/sdk';
import {Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Create a new role.
 */
export default class RolesCreate extends BaseCommand<typeof RolesCreate> {
  static override args = {};
  static override description = 'Create a new role in the Directus instance';
  static override examples = [
    '<%= config.bin %> <%= command.id %> --name "Editor"',
    '<%= config.bin %> <%= command.id %> --name "Manager" --admin-access',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    adminAccess: Flags.boolean({
      default: false,
      description: 'Grant admin access to this role',
    }),
    appAccess: Flags.boolean({
      default: true,
      description: 'Grant app access to this role',
    }),
    description: Flags.string({
      char: 'd',
      description: 'Role description',
      helpValue: '<description>',
    }),
    icon: Flags.string({
      default: 'supervised_user_circle',
      description: 'Role icon',
    }),
    name: Flags.string({
      char: 'n',
      description: 'Role name',
      required: true,
    }),
  };
  static override summary = 'Create role';

  public async run(): Promise<void> {
    const {flags} = await this.parse(RolesCreate);

    const roleData: Record<string, unknown> = {
      // eslint-disable-next-line camelcase
      admin_access: flags.adminAccess,
      // eslint-disable-next-line camelcase
      app_access: flags.appAccess,
      icon: flags.icon,
      name: flags.name,
    };

    if (flags.description) roleData.description = flags.description;

    const sdkCommand = createRole(roleData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
