import {readRoles} from '@directus/sdk';
import {Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * List roles in the Directus instance.
 */
export default class RolesList extends BaseCommand<typeof RolesList> {
  static override description = 'List roles in the Directus instance';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --fields id,name',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    fields: Flags.string({
      char: 'f',
      description: 'Comma-separated fields to retrieve',
      helpValue: '<fields>',
    }),
  };
  static override summary = 'List roles';

  public async run(): Promise<void> {
    const {flags} = await this.parse(RolesList);

    const fields = flags.fields ? flags.fields.split(',').map(f => f.trim()) : undefined;
    const query = fields ? {fields} : undefined;

    const sdkCommand = readRoles(query as never) as unknown as SdkRestCommand<unknown[]>;
    const result = await this.client.request(sdkCommand);

    const data = Array.isArray(result) ? result : ((result as {data?: unknown[]}).data ?? []);
    this.outputFormatted(data);
  }
}
