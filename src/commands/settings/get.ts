import {readSettings} from '@directus/sdk';
import {Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Get Directus instance settings.
 */
export default class SettingsGet extends BaseCommand<typeof SettingsGet> {
  static override description = 'Get Directus instance settings';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --fields project_name,project_color',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    fields: Flags.string({
      char: 'f',
      description: 'Comma-separated fields to retrieve',
      helpValue: '<fields>',
    }),
  };
  static override summary = 'Get settings';

  public async run(): Promise<void> {
    const {flags} = await this.parse(SettingsGet);

    const fields = flags.fields ? flags.fields.split(',').map(f => f.trim()) : undefined;
    const query = fields ? {fields} : undefined;

    const sdkCommand = readSettings(query as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
