import {updateSettings} from '@directus/sdk';
import {Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Update Directus instance settings.
 */
export default class SettingsUpdate extends BaseCommand<typeof SettingsUpdate> {
  static override description = 'Update Directus instance settings';
  static override examples = [
    '<%= config.bin %> <%= command.id %> --project_name "My Project"',
    '<%= config.bin %> <%= command.id %> --project_color "#3498db" --project_logo <file-id>',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    // eslint-disable-next-line camelcase
    custom_css: Flags.string({
      description: 'Custom CSS for the admin app',
      helpValue: '<css>',
    }),
    // eslint-disable-next-line camelcase
    module_bar: Flags.string({
      description: 'JSON array of module bar items',
      helpValue: '<json>',
    }),
    // eslint-disable-next-line camelcase
    project_color: Flags.string({
      char: 'c',
      description: 'Project color (hex code)',
      helpValue: '<hex>',
    }),
    // eslint-disable-next-line camelcase
    project_logo: Flags.string({
      description: 'Project logo file ID',
      helpValue: '<file-id>',
    }),
    // eslint-disable-next-line camelcase
    project_name: Flags.string({
      char: 'n',
      description: 'Project name',
      helpValue: '<name>',
    }),
    // eslint-disable-next-line camelcase
    project_url: Flags.string({
      description: 'Project URL',
      helpValue: '<url>',
    }),
    // eslint-disable-next-line camelcase
    public_background: Flags.string({
      description: 'Public background file ID',
      helpValue: '<file-id>',
    }),
    // eslint-disable-next-line camelcase
    public_foreground: Flags.string({
      description: 'Public foreground file ID',
      helpValue: '<file-id>',
    }),
    // eslint-disable-next-line camelcase
    public_note: Flags.string({
      description: 'Public login page note',
      helpValue: '<text>',
    }),
  };
  static override summary = 'Update settings';

  public async run(): Promise<void> {
    const {flags} = await this.parse(SettingsUpdate);

    const settingsData: Record<string, unknown> = {};

    // eslint-disable-next-line camelcase
    if (flags.project_name !== undefined) settingsData.project_name = flags.project_name;
    // eslint-disable-next-line camelcase
    if (flags.project_color !== undefined) settingsData.project_color = flags.project_color;
    // eslint-disable-next-line camelcase
    if (flags.project_logo !== undefined) settingsData.project_logo = flags.project_logo;
    // eslint-disable-next-line camelcase
    if (flags.project_url !== undefined) settingsData.project_url = flags.project_url;
    // eslint-disable-next-line camelcase
    if (flags.public_note !== undefined) settingsData.public_note = flags.public_note;
    // eslint-disable-next-line camelcase
    if (flags.public_background !== undefined) settingsData.public_background = flags.public_background;
    // eslint-disable-next-line camelcase
    if (flags.public_foreground !== undefined) settingsData.public_foreground = flags.public_foreground;
    // eslint-disable-next-line camelcase
    if (flags.custom_css !== undefined) settingsData.custom_css = flags.custom_css;

    if (flags.module_bar) {
      try {
        // eslint-disable-next-line camelcase
        settingsData.module_bar = JSON.parse(flags.module_bar);
      } catch {
        this.error('Invalid JSON for module_bar flag');
      }
    }

    if (Object.keys(settingsData).length === 0) {
      this.error('At least one setting to update must be provided');
    }

    const sdkCommand = updateSettings(settingsData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
