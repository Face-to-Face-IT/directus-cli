import {updateRelation} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Update an existing relation.
 */
export default class RelationsUpdate extends BaseCommand<typeof RelationsUpdate> {
  static override args = {
    collection: Args.string({
      description: 'Collection name',
      required: true,
    }),
    field: Args.string({
      description: 'Field name',
      required: true,
    }),
  };
  static override description = 'Update a relation';
  static override examples = [
    '<%= config.bin %> <%= command.id %> cases assigned_to --meta \'{"one_field":"assigned_cases"}\'',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    meta: Flags.string({
      char: 'm',
      description: 'JSON metadata for the relation',
      helpValue: '<json>',
    }),
  };
  static override summary = 'Update relation';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(RelationsUpdate);

    const relationData: Record<string, unknown> = {};

    if (flags.meta) {
      try {
        relationData.meta = JSON.parse(flags.meta);
      } catch {
        this.error('Invalid JSON for meta flag');
      }
    }

    if (Object.keys(relationData).length === 0) {
      this.error('At least one field to update must be provided');
    }

    const sdkCommand = updateRelation(
      args.collection,
      args.field,
      relationData as never,
    ) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
