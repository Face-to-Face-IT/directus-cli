import {Command, Flags} from '@oclif/core';

import {loginAndStoreTokens} from '../../lib/auth.js';

/**
 * Login to a Directus instance.
 */
export default class AuthLogin extends Command {
  static override description = 'Authenticate with email/password and store tokens';
  static override examples = [
    '<%= config.bin %> <%= command.id %> --email admin@example.com --password secret',
    '<%= config.bin %> <%= command.id %> -p dev --email admin@example.com --password secret',
    'cat ~/.secrets/directus-admin | <%= config.bin %> <%= command.id %> --email admin@example.com --password-stdin',
  ];
  static override flags = {
    email: Flags.string({
      char: 'e',
      description: 'Email address',
      required: true,
    }),
    password: Flags.string({
      char: 'w',
      description: 'Password (avoid in shared shells; prefer --password-stdin for CI/agent use)',
      exclusive: ['password-stdin'],
    }),
    'password-stdin': Flags.boolean({
      default: false,
      description: 'Read the password from standard input. Keeps the password out of shell history, process lists, and transcripts.',
      exclusive: ['password'],
    }),
    profile: Flags.string({
      char: 'p',
      default: 'default',
      description: 'Profile to authenticate',
    }),
    url: Flags.string({
      description: 'Directus URL (overrides profile)',
    }),
  };
  static override summary = 'Login to Directus';

  public async run(): Promise<void> {
    const {flags} = await this.parse(AuthLogin);

    const password = flags['password-stdin']
      ? await readStdin()
      : flags.password;

    if (!password) {
      this.error('A password is required. Pass --password <value> or --password-stdin and pipe the password on stdin.');
    }

    await loginAndStoreTokens(flags.profile, flags.email, password, flags.url);

    this.log(`Successfully logged in to profile "${flags.profile}".`);
  }
}

/**
 * Read and trim a single line (or blob) from standard input.
 * Trims trailing whitespace/newlines so `echo "secret" | ...` works as expected.
 *
 * Throws a clear error when stdin is a TTY (interactive terminal) so the
 * process does not hang indefinitely waiting for EOF the user cannot send.
 */
async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    const msg = [
      '--password-stdin was provided but stdin is a TTY.',
      'Pipe the password via stdin, e.g.',
      '`echo "$PASSWORD" | directus-cli auth login --email <email> --password-stdin`',
      'or `cat secret.txt | directus-cli auth login ... --password-stdin`.',
    ].join(' ');
    throw new Error(msg);
  }

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
  }

  return Buffer.concat(chunks).toString('utf8').replace(/\s+$/u, '');
}
