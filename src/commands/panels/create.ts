import {createPanel} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Create a new panel.
 */
export default class PanelsCreate extends BaseCommand<typeof PanelsCreate> {
  static override args = {
    dashboard: Args.string({
      description: 'Dashboard ID to add panel to',
      required: true,
    }),
    name: Args.string({
      description: 'Panel name',
      required: true,
    }),
    type: Args.string({
      description: 'Panel type (metric, time-series, bar-chart, etc.)',
      required: true,
    }),
  };
  static override description = 'Create a new dashboard panel';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <dashboard-id> "Total Users" metric',
    '<%= config.bin %> <%= command.id %> <dashboard-id> "Sales Trend" time-series --options \'{"collection":"orders"}\'',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    color: Flags.string({
      char: 'c',
      description: 'Panel color',
      helpValue: '<color>',
    }),
    height: Flags.integer({
      char: 'h',
      default: 4,
      description: 'Panel height (in grid units)',
    }),
    icon: Flags.string({
      description: 'Panel icon',
    }),
    note: Flags.string({
      char: 'n',
      description: 'Panel description',
      helpValue: '<text>',
    }),
    options: Flags.string({
      char: 'o',
      description: 'JSON options for the panel',
      helpValue: '<json>',
    }),
    // eslint-disable-next-line camelcase
    position_x: Flags.integer({
      default: 0,
      description: 'X position (in grid units)',
      helpValue: '<x>',
    }),
    // eslint-disable-next-line camelcase
    position_y: Flags.integer({
      default: 0,
      description: 'Y position (in grid units)',
      helpValue: '<y>',
    }),
    width: Flags.integer({
      char: 'w',
      default: 4,
      description: 'Panel width (in grid units)',
    }),
  };
  static override summary = 'Create panel';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PanelsCreate);

    const panelData: Record<string, unknown> = {
      dashboard: args.dashboard,
      height: flags.height,
      name: args.name,
      // eslint-disable-next-line camelcase
      position_x: flags.position_x,
      // eslint-disable-next-line camelcase
      position_y: flags.position_y,
      type: args.type,
      width: flags.width,
    };

    if (flags.color) panelData.color = flags.color;
    if (flags.icon) panelData.icon = flags.icon;
    if (flags.note) panelData.note = flags.note;

    if (flags.options) {
      try {
        panelData.options = JSON.parse(flags.options);
      } catch {
        this.error('Invalid JSON for options flag');
      }
    }

    const sdkCommand = createPanel(panelData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
