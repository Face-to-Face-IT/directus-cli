import {Args, Flags} from '@oclif/core';

import {BaseCommand} from '../../base-command.js';
import {searchRegistry, unwrap} from '../../lib/extensions-registry.js';

/**
 * Search the Directus marketplace registry for extensions.
 */
export default class ExtensionsSearch extends BaseCommand<typeof ExtensionsSearch> {
  static override args = {
    query: Args.string({
      description: 'Search terms (extension name, keywords, etc.)',
      required: false,
    }),
  };
  static override description = 'Search the Directus marketplace registry at registry.directus.io';
  static override examples = [
    '<%= config.bin %> <%= command.id %> computed',
    '<%= config.bin %> <%= command.id %> --type interface',
    '<%= config.bin %> <%= command.id %> tag --limit 5',
    '<%= config.bin %> <%= command.id %> --sandbox',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({
      default: 25,
      description: 'Maximum number of results to return',
      helpValue: '<n>',
    }),
    offset: Flags.integer({
      default: 0,
      description: 'Number of results to skip',
      helpValue: '<n>',
    }),
    sandbox: Flags.boolean({
      description: 'Show only sandboxed extensions (safe for MARKETPLACE_TRUST=sandbox)',
    }),
    type: Flags.string({
      description:
        'Filter by extension type (interface, display, layout, module, panel, hook, endpoint, operation, bundle)',
      helpValue: '<type>',
    }),
  };
  static override summary = 'Search marketplace registry';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ExtensionsSearch);

    const result = await this.client.request(searchRegistry({
      limit: flags.limit,
      offset: flags.offset,
      sandbox: flags.sandbox ? true : undefined,
      search: args.query,
      type: flags.type,
    }));

    const items = unwrap(result);
    const meta = Array.isArray(result) ? undefined : result.meta;

    const data = items.map(ext => ({
      description: ext.description ?? '',
      downloads: ext.total_downloads ?? ext.downloads ?? 0,
      id: ext.id,
      // eslint-disable-next-line camelcase
      last_updated: ext.last_updated ?? '',
      name: ext.name,
      publisher: ext.publisher ?? '',
      sandbox: ext.sandbox ?? false,
      type: ext.type ?? '',
    }));

    this.outputFormatted(data, {
      filterCount: meta?.filter_count,
      totalCount: meta?.filter_count,
    });
  }
}
