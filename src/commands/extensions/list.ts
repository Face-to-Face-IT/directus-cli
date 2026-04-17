import {readExtensions} from '@directus/sdk';
import {Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * List all installed extensions.
 */
export default class ExtensionsList extends BaseCommand<typeof ExtensionsList> {
  static override args = {};
  static override description = 'List all installed extensions with name, type, version, and enabled status';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --type hook',
    '<%= config.bin %> <%= command.id %> --enabled',
    '<%= config.bin %> <%= command.id %> -f table',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    enabled: Flags.boolean({
      description: 'Show only enabled extensions',
    }),
    type: Flags.string({
      description:
        'Filter by extension type (interface, display, layout, module, panel, hook, endpoint, operation, bundle)',
      helpValue: '<type>',
    }),
  };
  static override summary = 'List extensions';

  public async run(): Promise<void> {
    const {flags} = await this.parse(ExtensionsList);

    const sdkCommand = readExtensions() as unknown as SdkRestCommand<unknown[]>;
    const result = await this.client.request(sdkCommand);

    let data = Array.isArray(result) ? result : ((result as {data?: unknown[]}).data ?? []);

    // Flatten extensions into a more useful shape for display
    data = data.map((ext: unknown) => {
      const e = ext as {
        bundle?: null | string;
        meta?: {enabled?: boolean};
        name?: string;
        schema?: null | {local?: boolean; type?: string; version?: string};
      };
      return {
        bundle: e.bundle ?? null,
        enabled: e.meta?.enabled ?? false,
        local: e.schema?.local ?? false,
        name: e.name ?? 'unknown',
        type: e.schema?.type ?? 'unknown',
        version: e.schema?.version ?? '-',
      };
    });

    // Apply filters
    if (flags.type) {
      const filterType = flags.type.toLowerCase();
      data = data.filter((e: unknown) => (e as {type: string}).type === filterType);
    }

    if (flags.enabled) {
      data = data.filter((e: unknown) => (e as {enabled: boolean}).enabled);
    }

    this.outputFormatted(data);
  }
}
