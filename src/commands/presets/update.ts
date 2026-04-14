import {updatePreset} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Update an existing preset.
 */
export default class PresetsUpdate extends BaseCommand<typeof PresetsUpdate> {
  static override args = {
    id: Args.string({
      description: 'Preset ID',
      required: true,
    }),
  };
  static override description = 'Update a preset (bookmark)';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <preset-id> --title "Updated Title"',
    '<%= config.bin %> <%= command.id %> <preset-id> --filter \'{"status":{"_eq":"active"}}\'',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    color: Flags.string({
      char: 'c',
      description: 'Preset color',
      helpValue: '<color>',
    }),

    filter: Flags.string({
      char: 'f',
      description: 'JSON filter query',
      helpValue: '<json>',
    }),
    icon: Flags.string({
      description: 'Preset icon',
    }),
    layout: Flags.string({
      char: 'l',
      description: 'Layout type',
      options: ['calendar', 'cards', 'map', 'tabular'],
    }),
    // eslint-disable-next-line camelcase
    layout_options: Flags.string({
      description: 'JSON layout options',
      helpValue: '<json>',
    }),
    // eslint-disable-next-line camelcase
    layout_query: Flags.string({
      description: 'JSON layout query',
      helpValue: '<json>',
    }),
    // eslint-disable-next-line camelcase
    refresh_interval: Flags.integer({
      description: 'Auto-refresh interval in seconds',
      helpValue: '<seconds>',
    }),

    role: Flags.string({
      char: 'r',
      description: 'Role ID (for role preset)',
      helpValue: '<role-id>',
    }),
    search: Flags.string({
      char: 's',
      description: 'Search query',
      helpValue: '<query>',
    }),
    title: Flags.string({
      char: 't',
      description: 'Preset title',
      helpValue: '<title>',
    }),

    user: Flags.string({
      char: 'u',
      description: 'User ID (for user preset, null for global)',
      helpValue: '<user-id>',
    }),
  };
  static override summary = 'Update preset';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PresetsUpdate);

    const presetData: Record<string, unknown> = {};

    if (flags.title !== undefined) presetData.title = flags.title;
    if (flags.icon !== undefined) presetData.icon = flags.icon;
    if (flags.color !== undefined) presetData.color = flags.color;
    if (flags.layout !== undefined) presetData.layout = flags.layout;
    if (flags.search !== undefined) presetData.search = flags.search;
    if (flags.role !== undefined) presetData.role = flags.role;
    if (flags.user !== undefined) presetData.user = flags.user;
    // eslint-disable-next-line camelcase
    if (flags.refresh_interval !== undefined) presetData.refresh_interval = flags.refresh_interval;

    if (flags.filter) {
      try {
        presetData.filter = JSON.parse(flags.filter);
      } catch {
        this.error('Invalid JSON for filter flag');
      }
    }

    if (flags.layout_options) {
      try {
        // eslint-disable-next-line camelcase
        presetData.layout_options = JSON.parse(flags.layout_options);
      } catch {
        this.error('Invalid JSON for layout_options flag');
      }
    }

    if (flags.layout_query) {
      try {
        // eslint-disable-next-line camelcase
        presetData.layout_query = JSON.parse(flags.layout_query);
      } catch {
        this.error('Invalid JSON for layout_query flag');
      }
    }

    if (Object.keys(presetData).length === 0) {
      this.error('At least one field to update must be provided');
    }

    const sdkCommand = updatePreset(Number(args.id), presetData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
