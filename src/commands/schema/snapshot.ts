import {schemaSnapshot} from '@directus/sdk';
import {Flags} from '@oclif/core';
import {writeFileSync} from 'node:fs';
import YAML from 'yaml';

import type {SchemaSnapshot as SchemaSnapshotType, SdkRestCommand} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Export a schema snapshot.
 */
export default class SchemaSnapshot extends BaseCommand<typeof SchemaSnapshot> {
  static override description = 'Export a snapshot of the current database schema';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -o schema.json',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    output: Flags.string({
      char: 'o',
      description: 'Output file path (default: stdout)',
      helpValue: '<path>',
    }),
  };
  static override summary = 'Export schema snapshot';

  public async run(): Promise<void> {
    const {flags} = await this.parse(SchemaSnapshot);

    // Create SDK command - cast through unknown to handle schema typing
    const sdkCommand = schemaSnapshot() as unknown as SdkRestCommand<SchemaSnapshotType>;
    const result = await this.client.request(sdkCommand);

    // Determine output format based on file extension or use JSON
    const outputPath = flags.output;
    const output
      = outputPath?.endsWith('.yaml') || outputPath?.endsWith('.yml')
        ? YAML.stringify(result)
        : JSON.stringify(result, null, 2);

    if (outputPath) {
      writeFileSync(outputPath, output, 'utf8');
      this.log(`Snapshot written to ${outputPath}`);
    } else {
      this.log(output);
    }
  }
}
