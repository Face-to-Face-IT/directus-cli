import {createOperation} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Create a new operation (flow step).
 */
export default class OperationsCreate extends BaseCommand<typeof OperationsCreate> {
  static override args = {
    flow: Args.string({
      description: 'Flow ID to add operation to',
      required: true,
    }),
    type: Args.string({
      description: 'Operation type (condition, exec, http-request, log, mail, notification, etc.)',
      required: true,
    }),
  };
  static override description = 'Create a new flow operation';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <flow-id> log --name "Log Step"',
    '<%= config.bin %> <%= command.id %> <flow-id> mail --name "Send Email" --options \'{"to":"{{$accountability.user}}"}\'',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      default: 'New Operation',
      description: 'Operation name',
    }),
    options: Flags.string({
      char: 'o',
      description: 'JSON options for the operation',
      helpValue: '<json>',
    }),
    position: Flags.string({
      description: 'Position of operation (append, prepend, or after:operation-id)',
      helpValue: '<position>',
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
  static override summary = 'Create operation';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(OperationsCreate);

    const operationData: Record<string, unknown> = {
      flow: args.flow,
      name: flags.name,
      type: args.type,
    };

    if (flags.options) {
      try {
        operationData.options = JSON.parse(flags.options);
      } catch {
        this.error('Invalid JSON for options flag');
      }
    }

    if (flags.position) operationData.position = flags.position;
    if (flags.resolve) operationData.resolve = flags.resolve;
    if (flags.reject) operationData.reject = flags.reject;

    const sdkCommand = createOperation(operationData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
