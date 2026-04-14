import {createField} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Create a new field in a collection.
 */
export default class FieldsCreate extends BaseCommand<typeof FieldsCreate> {
  static override args = {
    collection: Args.string({
      description: 'Collection name',
      required: true,
    }),
    field: Args.string({
      description: 'Field name/key',
      required: true,
    }),
  };
  static override description = 'Create a new field in a collection';
  static override examples = [
    '<%= config.bin %> <%= command.id %> posts title --type string',
    '<%= config.bin %> <%= command.id %> articles content --type text --required',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    interface: Flags.string({
      char: 'i',
      default: 'input',
      description: 'Field interface (UI component)',
      helpValue: '<interface>',
    }),
    note: Flags.string({
      char: 'n',
      description: 'Field note/help text',
      helpValue: '<text>',
    }),
    required: Flags.boolean({
      default: false,
      description: 'Make field required',
    }),
    type: Flags.string({
      char: 't',
      default: 'string',
      description: 'Field data type',
      helpValue: '<type>',
      options: ['string', 'text', 'integer', 'decimal', 'boolean', 'date', 'datetime', 'json', 'csv', 'uuid'],
    }),
  };
  static override summary = 'Create field';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(FieldsCreate);

    const fieldData = {
      collection: args.collection,
      field: args.field,
      meta: {
        interface: flags.interface,
        note: flags.note,
        required: flags.required,
      },
      type: flags.type,
    };

    const sdkCommand = createField(args.collection, fieldData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
