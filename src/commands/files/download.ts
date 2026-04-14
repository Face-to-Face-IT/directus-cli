import {readFiles} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Download a file from the Directus file library.
 */
export default class FilesDownload extends BaseCommand<typeof FilesDownload> {
  static override args = {
    id: Args.string({
      description: 'File ID',
      required: true,
    }),
  };
  static override description = 'Download a file from the Directus file library';
  static override examples = [
    '<%= config.bin %> <%= command.id %> <file-id>',
    '<%= config.bin %> <%= command.id %> <file-id> --output ./downloads/',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    output: Flags.string({
      char: 'o',
      default: '.',
      description: 'Output directory or file path',
      helpValue: '<path>',
    }),
  };
  static override summary = 'Download file';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(FilesDownload);

    // First get file metadata
    const sdkCommand = readFiles({
      filter: {id: {_eq: args.id}},
      limit: 1,
    } as never) as unknown as SdkRestCommand<unknown[]>;

    const result = await this.client.request(sdkCommand);
    const files = Array.isArray(result) ? result : ((result as {data?: unknown[]}).data ?? []);

    if (files.length === 0) {
      this.error(`File ${args.id} not found`);
    }

    const file = files[0] as {filename_download?: string; id: string};
    const filename = file.filename_download || file.id;

    // Construct download URL
    const downloadUrl = `${this.connection.url}/assets/${args.id}`;

    this.log(`File download URL: ${downloadUrl}`);
    this.log(`Filename: ${filename}`);
    this.log(`Output path: ${flags.output}`);
    this.log('');
    this.log('To download, use curl or wget:');
    this.log(`  curl -o "${flags.output}/${filename}" "${downloadUrl}"`);
  }
}
