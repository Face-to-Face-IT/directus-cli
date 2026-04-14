import {utilsImport} from '@directus/sdk';
import {Args} from '@oclif/core';
import {readFile} from 'node:fs/promises';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Import data into a collection.
 */
export default class ImportCommand extends BaseCommand<typeof ImportCommand> {
  static override args = {
    collection: Args.string({
      description: 'Collection to import into',
      required: true,
    }),
    file: Args.string({
      description: 'File to import from',
      required: true,
    }),
  };
  static override description = 'Import data from file into a collection';
  static override examples = [
    '<%= config.bin %> <%= command.id %> cases ./cases.json',
    '<%= config.bin %> <%= command.id %> users ./users.csv',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
  };
  static override summary = 'Import data';

  public async run(): Promise<void> {
    const {args} = await this.parse(ImportCommand);

    let fileData: string;
    try {
      fileData = await readFile(args.file, 'utf8');
    } catch {
      this.error(`Failed to read file: ${args.file}`);
    }

    // Create FormData for import
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    const formData = new FormData();
    const blob = new Blob([fileData]);
    const fileName = args.file.split('/').pop() ?? 'import';
    formData.append('file', blob, fileName);

    // utilsImport takes: collection, formData
    const sdkCommand = utilsImport(args.collection as never, formData as never) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
