import {createRelation} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Create a new relation between collections.
 */
export default class RelationsCreate extends BaseCommand<typeof RelationsCreate> {
  static override args = {
    collection: Args.string({
      description: 'Collection name (many side)',
      required: true,
    }),
    field: Args.string({
      description: 'Field name in the collection',
      required: true,
    }),
  };
  static override description = 'Create a new relation between collections';
  static override examples = [
    '<%= config.bin %> <%= command.id %> cases assigned_to --related_collection users',
    '<%= config.bin %> <%= command.id %> posts author --related_collection users --meta \'{"one_field":"posts"}\'',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    meta: Flags.string({
      char: 'm',
      description: 'JSON metadata for the relation',
      helpValue: '<json>',
    }),
    // eslint-disable-next-line camelcase
    related_collection: Flags.string({
      char: 'r',
      description: 'Related collection name (one side)',
      helpValue: '<collection>',
      required: true,
    }),
    // eslint-disable-next-line camelcase
    related_field: Flags.string({
      description: 'Related field name (for O2M relations)',
      helpValue: '<field>',
    }),
    schema: Flags.string({
      char: 's',
      description: 'JSON schema options',
      helpValue: '<json>',
    }),
  };
  static override summary = 'Create relation';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(RelationsCreate);

    const relationData: Record<string, unknown> = {
      collection: args.collection,
      field: args.field,
      // eslint-disable-next-line camelcase
      related_collection: flags.related_collection,
    };

    // eslint-disable-next-line camelcase
    if (flags.related_field) relationData.related_field = flags.related_field;

    if (flags.meta) {
      try {
        relationData.meta = JSON.parse(flags.meta);
      } catch {
        this.error('Invalid JSON for meta flag');
      }
    }

    if (flags.schema) {
      try {
        relationData.schema = JSON.parse(flags.schema);
      } catch {
        this.error('Invalid JSON for schema flag');
      }
    }

    const sdkCommand = createRelation(relationData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
