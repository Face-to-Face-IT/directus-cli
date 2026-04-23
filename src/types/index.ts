/**
 * Type definitions for the Directus CLI.
 */

/**
 * Generic API response with optional metadata.
 */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    filter_count?: number;
    total_count?: number;
  };
}

/**
 * Standard command args with string values.
 * oclif's type inference sometimes produces `never` for args,
 * so we use this interface for safe access.
 */
export interface CommandArgs {
  [key: string]: string | undefined;
}

/**
 * Custom error class for Directus CLI errors.
 */
export class DirectusCliError extends Error {
  public readonly code?: string;
  public readonly errors?: Array<{extensions?: Record<string, unknown>; message: string}>;
  public readonly statusCode?: number;

  constructor(
    message: string,
    statusCode?: number,
    code?: string,
    errors?: Array<{extensions?: Record<string, unknown>; message: string}>,
  ) {
    super(message);
    this.name = 'DirectusCliError';
    this.code = code;
    this.errors = errors;
    this.statusCode = statusCode;
  }

  /**
   * Create a DirectusCliError from an unknown error.
   */
  static from(error: unknown): DirectusCliError {
    if (error instanceof DirectusCliError) {
      return error;
    }

    // Handle Directus SDK error format (not instanceof Error)
    const err = error as {
      code?: string;
      errors?: Array<{extensions?: Record<string, unknown>; message: string}>;
      message?: string;
      response?: {
        data?: {
          errors?: Array<{extensions?: Record<string, unknown>; message: string}>;
        };
        status?: number;
      };
    };

    // Check for SDK errors array first
    if (err.errors && err.errors.length > 0) {
      const message = err.errors.map(e => e.message).join('; ');
      return new DirectusCliError(message, err.response?.status, err.code, err.errors);
    }

    // Check for response.data.errors (Directus API format)
    const responseErrors = err.response?.data?.errors;
    if (responseErrors && responseErrors.length > 0) {
      const message = responseErrors.map(e => e.message).join('; ');
      return new DirectusCliError(message, err.response?.status, err.code, responseErrors);
    }

    // Use message if available
    if (err.message) {
      return new DirectusCliError(err.message, err.response?.status, err.code);
    }

    if (error instanceof Error) {
      return new DirectusCliError(error.message);
    }

    return new DirectusCliError(String(error));
  }
}

/**
 * Items command args.
 */
export interface ItemsCommandArgs extends CommandArgs {
  collection: string;
  id?: string;
}

/**
 * Item data for create/update operations.
 */
export type ItemData = Record<string, unknown>;

/**
 * Query parameters for list operations.
 */
export interface ListQuery {
  fields?: string[];
  filter?: Record<string, unknown>;
  limit?: number;
  meta?: string;
  offset?: number;
  page?: number;
  search?: string;
  sort?: string[];
}

/**
 * Schema command args.
 */
export interface SchemaCommandArgs extends CommandArgs {
  path: string;
}

/**
 * Schema diff result.
 */
export interface SchemaDiff {
  diff?: {
    collections?: unknown[];
    fields?: unknown[];
    relations?: unknown[];
  };
  hash?: string;
}

/**
 * Schema snapshot structure.
 */
export interface SchemaSnapshot {
  collections?: unknown[];
  directus?: string;
  fields?: unknown[];
  relations?: unknown[];
  vendor?: string;
  version?: number;
}

/**
 * Generic SDK query parameters.
 * Matches the shape expected by @directus/sdk query options.
 */
export interface SdkQuery {
  fields?: string[];
  filter?: Record<string, unknown>;
  limit?: number;
  meta?: string;
  offset?: number;
  search?: string;
  sort?: string[];
}

/**
 * SDK RestCommand type.
 *
 * Commands returned by `@directus/sdk` functions (`readItems()`,
 * `readItem()`, `createItem()`, etc.) are *functions* of the form
 * `(client) => ({method, path, body, ...})`. The SDK invokes them as
 * `command(client)` inside `client.request()`, which means a plain object
 * command throws `<arg> is not a function`.
 *
 * We keep the type broad (unknown) because:
 *  - All current call sites cast SDK builder results via `as unknown as
 *    SdkRestCommand<T>` — the surface type is effectively a phantom carrier
 *    for `TResult` inference.
 *  - Custom builders in this repo (`src/lib/extensions-registry.ts`) must
 *    return functions to be compatible with the SDK.
 */
export type SdkRestCommand<TResult> = ((client?: unknown) => {
  body?: unknown;
  method: string;
  params?: unknown;
  path: string;
  query?: unknown;
}) & {
  /** Type marker for the expected result type */
  __resultType?: TResult;
};
