import {updateField} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Update an existing field.
 */
export default class FieldsUpdate extends BaseCommand<typeof FieldsUpdate> {
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
  static override description = 'Update a field in a collection';
  static override examples = [
    '<%= config.bin %> <%= command.id %> posts title --note "Post title"',
    '<%= config.bin %> <%= command.id %> articles status --interface dropdown',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    interface: Flags.string({
      char: 'i',
      description: 'Field interface (UI component)',
      helpValue: '<interface>',
    }),
    note: Flags.string({
      char: 'n',
      description: 'Field note/help text',
      helpValue: '<text>',
    }),
    options: Flags.string({
      description: 'JSON string of interface options',
      helpValue: '<json>',
    }),
    readonly: Flags.boolean({
      allowNo: true,
      description: 'Set field as readonly',
    }),
    required: Flags.boolean({
      allowNo: true,
      description: 'Make field required',
    }),
  };
  static override summary = 'Update field';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(FieldsUpdate);

    const meta: Record<string, unknown> = {};

    if (flags.interface !== undefined) meta.interface = flags.interface;
    if (flags.note !== undefined) meta.note = flags.note;
    if (flags.required !== undefined) meta.required = flags.required;
    if (flags.readonly !== undefined) meta.readonly = flags.readonly;
    if (flags.options) {
      try {
        meta.options = JSON.parse(flags.options);
      } catch {
        this.error('Invalid JSON for options flag');
      }
    }

    if (Object.keys(meta).length === 0) {
      this.error('At least one field to update must be provided');
    }

    const fieldData = {meta};

    const sdkCommand = updateField(
      args.collection,
      args.field,
      fieldData as never,
    ) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
