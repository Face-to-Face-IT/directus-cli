import {schemaApply, schemaDiff} from '@directus/sdk';
import {Args, Flags} from '@oclif/core';
import {readFileSync} from 'node:fs';
import YAML from 'yaml';

import type {
  SchemaCommandArgs, SchemaDiff, SchemaSnapshot, SdkRestCommand,
} from '../../types/index.js';

import {BaseCommand} from '../../base-command.js';

/**
 * Apply a schema snapshot or diff.
 */
export default class SchemaApply extends BaseCommand<typeof SchemaApply> {
  static override args = {
    path: Args.string({
      description: 'Path to snapshot file (JSON or YAML)',
      required: true,
    }),
  };
  static override description = 'Apply a schema snapshot or diff to the instance';
  static override examples = [
    '<%= config.bin %> <%= command.id %> ./schema.json --dry-run',
    '<%= config.bin %> <%= command.id %> ./schema.json --yes',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    'dry-run': Flags.boolean({
      default: false,
      description: 'Show diff without applying changes',
    }),
    force: Flags.boolean({
      default: false,
      description: 'Bypass version/vendor checks',
    }),
    yes: Flags.boolean({
      char: 'y',
      default: false,
      description: 'Skip confirmation prompt',
    }),
  };
  static override summary = 'Apply schema';

  public async run(): Promise<void> {
    const {flags} = await this.parse(SchemaApply);

    // Safely access args with proper typing
    const args = this.args as SchemaCommandArgs;
    const {path} = args;

    // Read and parse snapshot
    const content = readFileSync(path, 'utf8');
    const snapshot: SchemaSnapshot
      = path.endsWith('.yaml') || path.endsWith('.yml')
        ? (YAML.parse(content) as SchemaSnapshot)
        : (JSON.parse(content) as SchemaSnapshot);

    // Get diff first
    const diffCommand = schemaDiff(snapshot as never, flags.force) as unknown as SdkRestCommand<SchemaDiff>;

    const diff = await this.client.request(diffCommand);

    // Show diff
    this.log('Schema diff:');
    this.outputFormatted(diff);

    if (flags['dry-run']) {
      this.log('\n(Dry run - no changes applied)');
      return;
    }

    // Confirm unless --yes
    if (!flags.yes) {
      const confirmed = await this.confirm('Apply these changes? (yes/no)');
      if (!confirmed) {
        this.log('Cancelled.');
        return;
      }
    }

    // Apply the diff
    const applyCommand = schemaApply(diff as never) as unknown as SdkRestCommand<void>;
    await this.client.request(applyCommand);

    this.log('Schema applied successfully.');
  }

  private async confirm(prompt: string): Promise<boolean> {
    const response = await new Promise<string>(resolve => {
      process.stdout.write(prompt + ' ');
      process.stdin.once('data', data => {
        resolve(data.toString().trim().toLowerCase());
      });
    });
    return response === 'yes' || response === 'y';
  }
}
