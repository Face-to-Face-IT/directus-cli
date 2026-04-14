import {serverInfo} from '@directus/sdk';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Get server information.
 */
export default class ServerInfo extends BaseCommand<typeof ServerInfo> {
  static override description = 'Get information about the Directus server';
  static override examples = ['<%= config.bin %> <%= command.id %>'];
  static override flags = {
    ...BaseCommand.baseFlags,
  };
  static override summary = 'Server info';

  public async run(): Promise<void> {
    // Create SDK command - cast through unknown to handle schema typing
    const sdkCommand = serverInfo() as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    this.outputFormatted(result);
  }
}
