import {updateFlow} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Update an existing flow.
 */
export default class FlowsUpdate extends BaseCommand<typeof FlowsUpdate> {
  static override args = {
    id: Args.string({
      description: 'Flow ID',
      required: true,
    }),
  };
  static override description = 'Update a flow';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <flow-id> --name "New Name"',
    '<%= config.bin %> <%= command.id %> <flow-id> --status active',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    accountability: Flags.string({
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
      description: 'Flow icon',
    }),
    name: Flags.string({
      char: 'n',
      description: 'Flow name',
    }),
    status: Flags.string({
      description: 'Flow status',
      options: ['active', 'inactive'],
    }),
    trigger: Flags.string({
      char: 't',
      description: 'Flow trigger type',
      options: ['event', 'hook', 'manual', 'operation', 'schedule', 'webhook'],
    }),
  };
  static override summary = 'Update flow';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(FlowsUpdate);

    const flowData: Record<string, unknown> = {};

    if (flags.name) flowData.name = flags.name;
    if (flags.description !== undefined) flowData.description = flags.description;
    if (flags.status) flowData.status = flags.status;
    if (flags.trigger) flowData.trigger = flags.trigger;
    if (flags.accountability) flowData.accountability = flags.accountability;
    if (flags.color !== undefined) flowData.color = flags.color;
    if (flags.icon) flowData.icon = flags.icon;

    if (Object.keys(flowData).length === 0) {
      this.error('At least one field to update must be provided');
    }

    const sdkCommand = updateFlow(args.id, flowData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
