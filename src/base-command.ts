import { Command, type Interfaces } from '@oclif/core';

import { globalFlags } from './flags/global.js';
import { isTokenExpired, refreshAndStoreTokens, resolveConnection, type ResolvedConnection } from './lib/auth.js';
import { createClient, type DirectusClient } from './lib/client.js';
import { formatOutput, type OutputFormat } from './lib/output.js';
import { type CommandArgs, DirectusCliError } from './types/index.js';

/**
 * Base command class for all Directus CLI commands.
 * Provides:
 * - Global flag definitions
 * - Connection resolution
 * - Client initialization with auth
 * - Formatted output
 * - Error handling
 */
export abstract class BaseCommand<T extends typeof Command> extends Command {
  // Global flags that all commands inherit
  static override baseFlags = globalFlags;
  protected client!: DirectusClient;
  protected connection!: ResolvedConnection;

  /**
   * Get the parsed args with proper typing.
   * Returns CommandArgs for safe access to string args.
   */
  protected get args(): CommandArgs {
    // Access the protected parsedArgs property through unknown cast
    const cmd = this as unknown as { parsedArgs: unknown };
    return cmd.parsedArgs as CommandArgs;
  }

  /**
   * Get the parsed flags with proper typing.
   */
  protected get flags(): Interfaces.InferredFlags<T['flags'] & typeof globalFlags> {
    // Access the protected parsedFlags property through unknown cast
    const cmd = this as unknown as { parsedFlags: unknown };
    return cmd.parsedFlags as Interfaces.InferredFlags<T['flags'] & typeof globalFlags>;
  }

  /**
   * Handle errors in a consistent way.
   */
  protected override async catch(error: Error & { exitCode?: number } & { statusCode?: number }): Promise<void> {
    const directusError = DirectusCliError.from(error);

    const parts: string[] = [];

    if (directusError.statusCode) {
      parts.push(`[${directusError.statusCode}]`);
    }

    parts.push(directusError.message);

    // Access verbose flag carefully - might not be available if init failed
    const flags = this.flags as unknown as undefined | { verbose?: boolean };
    if (flags?.verbose && directusError.errors) {
      for (const err of directusError.errors) {
        if (err.extensions) {
          parts.push(`\n  ${JSON.stringify(err.extensions)}`);
        }
      }
    }

    this.error(parts.join(' '), { exit: directusError.statusCode ?? 1 });
  }

  /**
   * Clean up resources after command execution.
   * Disconnects the Bottleneck limiter so the process can exit cleanly.
   */
  protected override async finally(_: Error | undefined): Promise<void> {
    if (this.client) {
      await this.client.destroy();
    }

    await super.finally(_);
  }

  /**
   * Initialize the command: resolve connection and create client.
   */
  protected override async init(): Promise<void> {
    await super.init();

    // Parse flags explicitly since parsedFlags isn't set yet during init()
    const parsed = await this.parse(this.constructor as typeof Command);

    // Store parsed flags and args so the getters work
    (this as unknown as { parsedFlags: unknown }).parsedFlags = parsed.flags;
    (this as unknown as { parsedArgs: unknown }).parsedArgs = parsed.args;

    // Resolve connection from flags/env/profile
    this.connection = resolveConnection({
      profile: parsed.flags.profile as string | undefined,
      token: parsed.flags.token as string | undefined,
      url: parsed.flags.url as string | undefined,
    });

    // Check if token needs refresh
    if (isTokenExpired(this.connection) && this.connection.profileName) {
      const refreshed = await refreshAndStoreTokens(this.connection.profileName);
      if (refreshed) {
        // Re-resolve to get new tokens
        this.connection = resolveConnection({
          profile: parsed.flags.profile as string | undefined,
          token: parsed.flags.token as string | undefined,
          url: parsed.flags.url as string | undefined,
        });
      }
    }

    // Create SDK client
    this.client = createClient({
      accessToken: this.connection.accessToken,
      refreshToken: this.connection.refreshToken,
      token: this.connection.token,
      url: this.connection.url,
      verbose: parsed.flags.verbose as boolean | undefined,
    });
  }

  /**
   * Output formatted data based on the --format flag.
   * Respects --quiet to suppress metadata and non-data output.
   */
  protected outputFormatted<TData>(data: TData, meta?: { filterCount?: number; totalCount?: number }): void {
    const format = this.flags.format as OutputFormat;
    const quiet = this.flags.quiet as boolean | undefined;
    const output = formatOutput(data, format, meta, quiet);
    this.log(output);
  }
}
