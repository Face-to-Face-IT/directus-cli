import {readPolicy} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Get a single policy by ID.
 */
export default class PoliciesGet extends BaseCommand<typeof PoliciesGet> {
  static override args = {
    id: Args.string({
      description: 'Policy ID',
      required: true,
    }),
  };
  static override description = 'Get an access policy by ID (Directus 11+)';
  static override examples = ['<%= config.bin %> <%= command.id %> <policy-id>'];
  static override flags = {
    ...BaseCommand.baseFlags,
    fields: Flags.string({
      char: 'f',
      description: 'Comma-separated fields to retrieve',
      helpValue: '<fields>',
    }),
  };
  static override summary = 'Get policy';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PoliciesGet);

    const fields = flags.fields ? flags.fields.split(',').map(f => f.trim()) : undefined;
    const query = fields ? {fields} : undefined;

    const sdkCommand = readPolicy(args.id, query as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
