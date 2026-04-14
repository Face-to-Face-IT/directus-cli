import {createFlow} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Create a new flow.
 */
export default class FlowsCreate extends BaseCommand<typeof FlowsCreate> {
  static override args = {
    name: Args.string({
      description: 'Flow name',
      required: true,
    }),
  };
  static override description = 'Create a new automation flow';
  static override examples = [
    '<%= config.bin %> <%= command.id %> "My Flow" --trigger webhook',
    '<%= config.bin %> <%= command.id %> "Email Notification" --trigger event --status active',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    accountability: Flags.string({
      default: 'all',
      description: 'Accountability mode',
      options: ['all', 'item', 'none'],
    }),
    color: Flags.string({
      description: 'Flow color (hex code)',
    }),
    description: Flags.string({
      char: 'd',
      description: 'Flow description',
      helpValue: '<text>',
    }),
    icon: Flags.string({
      default: 'bolt',
      description: 'Flow icon',
    }),
    status: Flags.string({
      default: 'inactive',
      description: 'Flow status',
      options: ['active', 'inactive'],
    }),
    trigger: Flags.string({
      char: 't',
      default: 'manual',
      description: 'Flow trigger type',
      options: ['event', 'hook', 'manual', 'operation', 'schedule', 'webhook'],
    }),
  };
  static override summary = 'Create flow';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(FlowsCreate);

    const flowData: Record<string, unknown> = {
      accountability: flags.accountability,
      color: flags.color,
      description: flags.description,
      icon: flags.icon,
      name: args.name,
      status: flags.status,
      trigger: flags.trigger,
    };

    const sdkCommand = createFlow(flowData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
