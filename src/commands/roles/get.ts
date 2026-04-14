import {readRole} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Get a single role by ID.
 */
export default class RolesGet extends BaseCommand<typeof RolesGet> {
  static override args = {
    id: Args.string({
      description: 'Role ID',
      required: true,
    }),
  };
  static override description = 'Get a role by ID';
  static override examples = ['<%= config.bin %> <%= command.id %> <role-id>'];
  static override flags = {
    ...BaseCommand.baseFlags,
    fields: Flags.string({
      char: 'f',
      description: 'Comma-separated fields to retrieve',
      helpValue: '<fields>',
    }),
  };
  static override summary = 'Get role';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(RolesGet);

    const fields = flags.fields ? flags.fields.split(',').map(f => f.trim()) : undefined;
    const query = fields ? {fields} : undefined;

    const sdkCommand = readRole(args.id, query as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
