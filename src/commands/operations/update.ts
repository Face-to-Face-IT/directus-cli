import {updateOperation} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Update an existing operation.
 */
export default class OperationsUpdate extends BaseCommand<typeof OperationsUpdate> {
  static override args = {
    id: Args.string({
      description: 'Operation ID',
      required: true,
    }),
  };
  static override description = 'Update a flow operation';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <operation-id> --name "New Name"',
    '<%= config.bin %> <%= command.id %> <operation-id> --options \'{"message":"Updated"}\'',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'Operation name',
    }),
    options: Flags.string({
      char: 'o',
      description: 'JSON options for the operation',
      helpValue: '<json>',
    }),
    reject: Flags.string({
      description: 'Operation ID to run on reject/failure',
      helpValue: '<operation-id>',
    }),
    resolve: Flags.string({
      description: 'Operation ID to run on resolve/success',
      helpValue: '<operation-id>',
    }),
  };
  static override summary = 'Update operation';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(OperationsUpdate);

    const operationData: Record<string, unknown> = {};

    if (flags.name) operationData.name = flags.name;
    if (flags.resolve !== undefined) operationData.resolve = flags.resolve;
    if (flags.reject !== undefined) operationData.reject = flags.reject;

    if (flags.options) {
      try {
        operationData.options = JSON.parse(flags.options);
      } catch {
        this.error('Invalid JSON for options flag');
      }
    }

    if (Object.keys(operationData).length === 0) {
      this.error('At least one field to update must be provided');
    }

    const sdkCommand = updateOperation(args.id, operationData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
