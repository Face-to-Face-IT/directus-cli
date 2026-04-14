import {readPreset} from '@directus/sdk';
import {Args} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Get a preset by ID.
 */
export default class PresetsGet extends BaseCommand<typeof PresetsGet> {
  static override args = {
    id: Args.string({
      description: 'Preset ID',
      required: true,
    }),
  };
  static override description = 'Get a preset by ID';
  static override examples = ['<%= config.bin %> <%= command.id %> <preset-id>'];
  static override flags = {
    ...BaseCommand.baseFlags,
  };
  static override summary = 'Get preset';

  public async run(): Promise<void> {
    const {args} = await this.parse(PresetsGet);

    const sdkCommand = readPreset(Number(args.id)) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
