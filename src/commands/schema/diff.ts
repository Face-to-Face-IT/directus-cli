import {schemaDiff} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';
import {readFileSync} from 'node:fs';
import YAML from 'yaml';

import type {
  SchemaCommandArgs,
  SchemaDiff as SchemaDiffResult,
  SchemaSnapshot,
  SdkRestCommand,
} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Compare a snapshot against the current instance.
 */
export default class SchemaDiff extends BaseCommand<typeof SchemaDiff> {
  static override args = {
    path: Args.string({
      description: 'Path to snapshot file (JSON or YAML)',
      required: true,
    }),
  };
  static override description = 'Compare a schema snapshot against the current instance';
  static override examples = [
    '<%= config.bin %> <%= command.id %> ./schema.json',
    '<%= config.bin %> <%= command.id %> ./schema.yaml --force',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    force: Flags.boolean({
      default: false,
      description: 'Bypass version/vendor checks',
    }),
  };
  static override summary = 'Compare schema snapshot';

  public async run(): Promise<void> {
    const {flags} = await this.parse(SchemaDiff);

    // Safely access args with proper typing
    const args = this.args as SchemaCommandArgs;
    const {path} = args;

    // Read and parse snapshot
    const content = readFileSync(path, 'utf8');
    const snapshot: SchemaSnapshot
      = path.endsWith('.yaml') || path.endsWith('.yml')
        ? (YAML.parse(content) as SchemaSnapshot)
        : (JSON.parse(content) as SchemaSnapshot);

    // Create SDK command - cast through unknown to handle schema typing
    const sdkCommand = schemaDiff(snapshot as never, flags.force) as unknown as SdkRestCommand<SchemaDiffResult>;

    const result = await this.client.request(sdkCommand);

    this.outputFormatted(result);
  }
}
