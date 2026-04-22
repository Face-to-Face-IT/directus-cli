import {readMe} from '@directus/sdk';
import {Flags} from '@oclif/core';

import {BaseCommand} from '../../base-command.js';
import {DirectusCliError, type SdkRestCommand} from '../../types/index.js';

interface MeResponse {
  email?: string;
  first_name?: null | string;
  id?: string;
  last_name?: null | string;
  role?: null | string | {id: string; name?: string};
}

interface AuthStatusOutput {
  account?: {
    email?: string;
    id?: string;
    name?: string;
    role?: null | string;
  };
  authenticated: boolean;
  error?: {
    detail?: string;
    kind: 'auth' | 'network' | 'unknown';
    message: string;
    statusCode?: number;
  };
  profile?: string;
  token?: {
    expiresAt?: string;
    expiresInSeconds?: number;
    kind: 'session' | 'static';
  };
  url?: string;
}

/**
 * Show current authentication status with rich diagnostics.
 */
export default class AuthStatus extends BaseCommand<typeof AuthStatus> {
  static override description = 'Display the current authentication status, token expiry, and account info';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -p prod',
    '<%= config.bin %> <%= command.id %> --format json',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    profile: Flags.string({
      char: 'p',
      description: 'Profile to check',
    }),
  };
  static override summary = 'Show auth status';

  public async run(): Promise<void> {
    await this.parse(AuthStatus);

    const output: AuthStatusOutput = {
      authenticated: false,
      profile: this.connection.profileName,
      url: this.connection.url,
    };

    // Describe the token we're using.
    if (this.connection.token) {
      output.token = {kind: 'static'};
    } else if (this.connection.accessToken) {
      const tokenInfo: NonNullable<AuthStatusOutput['token']> = {kind: 'session'};
      if (this.connection.expiresAt) {
        const remaining = Math.round((this.connection.expiresAt - Date.now()) / 1000);
        tokenInfo.expiresAt = new Date(this.connection.expiresAt).toISOString();
        tokenInfo.expiresInSeconds = remaining;
      }

      output.token = tokenInfo;
    }

    // Attempt to hit /users/me to confirm the server accepts our token.
    try {
      const sdkCommand = readMe({
        fields: ['id', 'email', 'first_name', 'last_name', 'role'],
      } as Parameters<typeof readMe>[0]) as unknown as SdkRestCommand<MeResponse>;
      const me = await this.client.request(sdkCommand);

      output.authenticated = true;
      output.account = {
        email: me.email,
        id: me.id,
        name: formatName(me.first_name, me.last_name),
        role: typeof me.role === 'object' && me.role !== null ? (me.role.name ?? me.role.id) : me.role ?? undefined,
      };
    } catch (error) {
      const directusError = DirectusCliError.from(error);
      const kind = classifyStatusError(directusError);
      output.error = {
        detail: directusError.errors?.map(e => e.message).join('; '),
        kind,
        message: directusError.message,
        statusCode: directusError.statusCode,
      };
    }

    this.outputFormatted(output);
  }
}

function formatName(first?: null | string, last?: null | string): string | undefined {
  const parts = [first, last].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : undefined;
}

function classifyStatusError(error: DirectusCliError): 'auth' | 'network' | 'unknown' {
  if (error.statusCode === 401 || error.statusCode === 403) return 'auth';
  const networkCodes = new Set(['EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT']);
  if (error.code && networkCodes.has(error.code)) return 'network';
  return 'unknown';
}
