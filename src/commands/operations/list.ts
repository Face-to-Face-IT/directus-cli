import {readOperations} from '@directus/sdk';
import {Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * List operations (flow steps) in the Directus instance.
 */
export default class OperationsList extends BaseCommand<typeof OperationsList> {
  static override description = 'List operations (flow steps) in the Directus instance';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --flow <flow-id>',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    fields: Flags.string({
      char: 'f',
      description: 'Comma-separated fields to retrieve',
      helpValue: '<fields>',
    }),
    flow: Flags.string({
      description: 'Filter by flow ID',
      helpValue: '<flow-id>',
    }),
  };
  static override summary = 'List operations';

  public async run(): Promise<void> {
    const {flags} = await this.parse(OperationsList);

    const query: Record<string, unknown> = {};
    const fields = flags.fields ? flags.fields.split(',').map(f => f.trim()) : undefined;
    if (fields) query.fields = fields;
    if (flags.flow) query.filter = {flow: {_eq: flags.flow}};

    const sdkCommand = readOperations(query as never) as unknown as SdkRestCommand<unknown[]>;
    const result = await this.client.request(sdkCommand);

    const data = Array.isArray(result) ? result : ((result as {data?: unknown[]}).data ?? []);
    this.outputFormatted(data);
  }
}
