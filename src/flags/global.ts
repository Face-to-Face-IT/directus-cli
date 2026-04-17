import { Flags } from '@oclif/core';

import type { OutputFormat } from '../lib/output.js';

/**
 * Global flags available on all commands.
 */
export const globalFlags = {
  format: Flags.custom<OutputFormat>({
    char: 'f',
    default: 'json',
    description: 'Output format',
    options: ['json', 'table', 'yaml'],
  })(),
  profile: Flags.string({
    char: 'p',
    description: 'Profile name from config',
    env: 'DIRECTUS_PROFILE',
    helpValue: '<name>',
  }),
  quiet: Flags.boolean({
    char: 'q',
    default: false,
    description: 'Suppress non-data output (headers, footers, status messages)',
  }),
  token: Flags.string({
    char: 't',
    description: 'Static access token (overrides profile)',
    env: 'DIRECTUS_TOKEN',
    helpValue: '<token>',
  }),
  url: Flags.string({
    description: 'Directus instance URL (overrides profile)',
    env: 'DIRECTUS_URL',
    helpValue: '<url>',
  }),
  verbose: Flags.boolean({
    char: 'v',
    default: false,
    description: 'Verbose output (request/response logging)',
  }),
};
