import {serverPing} from '@directus/sdk';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Ping the server to check health.
 */
export default class ServerPing extends BaseCommand<typeof ServerPing> {
  static override description = 'Check if the Directus server is healthy';
  static override examples = ['<%= config.bin %> <%= command.id %>'];
  static override flags = {
    ...BaseCommand.baseFlags,
  };
  static override summary = 'Ping server';

  public async run(): Promise<void> {
    try {
      // Create SDK command - cast through unknown to handle schema typing
      const sdkCommand = serverPing() as unknown as SdkRestCommand<string>;
      await this.client.request(sdkCommand);
      this.log('Server is healthy.');
    } catch {
      this.error('Server is not responding.');
    }
  }
}
