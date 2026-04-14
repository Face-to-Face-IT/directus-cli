import {updatePanel} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Update an existing panel.
 */
export default class PanelsUpdate extends BaseCommand<typeof PanelsUpdate> {
  static override args = {
    id: Args.string({
      description: 'Panel ID',
      required: true,
    }),
  };
  static override description = 'Update a dashboard panel';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <panel-id> --name "Updated Name"',
    '<%= config.bin %> <%= command.id %> <panel-id> --options \'{"collection":"new_collection"}\'',
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
      description: 'Panel height (in grid units)',
    }),
    icon: Flags.string({
      description: 'Panel icon',
    }),
    name: Flags.string({
      char: 'n',
      description: 'Panel name',
    }),
    note: Flags.string({
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
      description: 'X position (in grid units)',
      helpValue: '<x>',
    }),
    // eslint-disable-next-line camelcase
    position_y: Flags.integer({
      description: 'Y position (in grid units)',
      helpValue: '<y>',
    }),
    width: Flags.integer({
      char: 'w',
      description: 'Panel width (in grid units)',
    }),
  };
  static override summary = 'Update panel';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PanelsUpdate);

    const panelData: Record<string, unknown> = {};

    if (flags.name) panelData.name = flags.name;
    if (flags.color !== undefined) panelData.color = flags.color;
    if (flags.icon !== undefined) panelData.icon = flags.icon;
    if (flags.note !== undefined) panelData.note = flags.note;
    if (flags.width !== undefined) panelData.width = flags.width;
    if (flags.height !== undefined) panelData.height = flags.height;
    // eslint-disable-next-line camelcase
    if (flags.position_x !== undefined) panelData.position_x = flags.position_x;
    // eslint-disable-next-line camelcase
    if (flags.position_y !== undefined) panelData.position_y = flags.position_y;

    if (flags.options) {
      try {
        panelData.options = JSON.parse(flags.options);
      } catch {
        this.error('Invalid JSON for options flag');
      }
    }

    if (Object.keys(panelData).length === 0) {
      this.error('At least one field to update must be provided');
    }

    const sdkCommand = updatePanel(args.id, panelData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
