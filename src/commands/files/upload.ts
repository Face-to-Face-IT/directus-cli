import {uploadFiles} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';
import {readFile} from 'node:fs/promises';

import type {SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Upload a file to Directus.
 */
export default class FilesUpload extends BaseCommand<typeof FilesUpload> {
  static override args = {
    path: Args.string({
      description: 'Local file path to upload',
      required: true,
    }),
  };
  static override description = 'Upload a file to the Directus file library';
  static override examples = [
    '<%= config.bin %> <%= command.id %> ./image.png',
    '<%= config.bin %> <%= command.id %> ./document.pdf --folder <folder-id>',
    '<%= config.bin %> <%= command.id %> ./photo.jpg --title "My Photo"',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    description: Flags.string({
      char: 'd',
      description: 'File description',
      helpValue: '<text>',
    }),
    folder: Flags.string({
      char: 'f',
      description: 'Folder ID to upload to',
      helpValue: '<folder-id>',
    }),
    tags: Flags.string({
      char: 't',
      description: 'Comma-separated tags',
      helpValue: '<tags>',
    }),
    title: Flags.string({
      char: 'T',
      description: 'File title',
      helpValue: '<title>',
    }),
  };
  static override summary = 'Upload file';

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(FilesUpload);

    const fileBuffer = await readFile(args.path).catch(() => {
      this.error(`Failed to read file: ${args.path}`);
    });

    const fileName = args.path.split('/').pop() ?? 'upload';

    // Convert Buffer to Uint8Array for File constructor compatibility
    const file = new File([new Uint8Array(fileBuffer)], fileName);

    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    const formData = new FormData();
    formData.append('file', file);

    if (flags.title) formData.append('title', flags.title);
    if (flags.description) formData.append('description', flags.description);
    if (flags.folder) formData.append('folder', flags.folder);
    if (flags.tags) formData.append('tags', JSON.stringify(flags.tags.split(',').map(t => t.trim())));

    const sdkCommand = uploadFiles(formData) as unknown as SdkRestCommand<unknown>;
    const result = await this.client.request(sdkCommand);

    const data = (result as {data?: unknown}).data ?? result;
    this.outputFormatted(data);
  }
}
