import {triggerFlow} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Trigger a manual flow.
 */
export default class FlowsTrigger extends BaseCommand<typeof FlowsTrigger> {
  static override args = {
    id: Args.string({
      description: 'Flow ID',
      required: true,
    }),
  };
  static override description = 'Trigger a manual flow execution';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <flow-id>',
    '<%= config.bin %> <%= command.id %> <flow-id> --payload \'{"key":"value"}\'',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    payload: Flags.string({
      char: 'p',
      description: 'JSON payload to send to the flow',
      helpValue: '<json>',
    }),
  };
  static override summary = 'Trigger flow';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(FlowsTrigger);

    let payload: Record<string, unknown> | undefined;
    if (flags.payload) {
      try {
        payload = JSON.parse(flags.payload) as Record<string, unknown>;
      } catch {
        this.error('Invalid JSON payload');
      }
    }

    const sdkCommand = triggerFlow(
      'POST',
      args.id,
      payload as Record<string, string>,
    ) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
