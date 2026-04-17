import Table from 'cli-table3';
import YAML from 'yaml';

/**
 * Supported output formats.
 */
export type OutputFormat = 'json' | 'table' | 'yaml';

/**
 * Format an error message for display.
 */
export function formatError(error: Error): string {
  return `Error: ${error.message}`;
}

/**
 * Format data for output based on the specified format.
 * When quiet is true, suppresses metadata (counts, footers) and outputs only the data payload.
 */
export function formatOutput(
  data: unknown,
  format: OutputFormat,
  meta?: { filterCount?: number; totalCount?: number },
  quiet?: boolean,
): string {
  const effectiveMeta = quiet ? undefined : meta;
  switch (format) {
    case 'json': {
      return quiet ? JSON.stringify(data, null, 2) : formatJson(data, effectiveMeta);
    }

    case 'table': {
      return formatTable(data, effectiveMeta);
    }

    case 'yaml': {
      return quiet ? YAML.stringify(data) : formatYaml(data, effectiveMeta);
    }

    default: {
      return quiet ? JSON.stringify(data, null, 2) : formatJson(data, effectiveMeta);
    }
  }
}

/**
 * Format as JSON with optional metadata.
 */
function formatJson(data: unknown, meta?: { filterCount?: number; totalCount?: number }): string {
  const output: Record<string, unknown> = { data };
  if (meta?.totalCount !== undefined) {
    output.meta = {
      // eslint-disable-next-line camelcase
      total_count: meta.totalCount,
      // eslint-disable-next-line camelcase
      ...(meta.filterCount !== undefined && { filter_count: meta.filterCount }),
    };
  }

  return JSON.stringify(output, null, 2);
}

/**
 * Format as a table. Only works for array data.
 */
function formatTable(data: unknown, meta?: { filterCount?: number; totalCount?: number }): string {
  if (!Array.isArray(data)) {
    // Fallback to JSON for non-array data
    return formatJson(data, meta);
  }

  if (data.length === 0) {
    return 'No results.' + (meta ? `\nTotal: ${meta.totalCount ?? 0} items` : '');
  }

  // Get column headers from first item
  const firstItem = data[0];
  if (typeof firstItem !== 'object' || firstItem === null) {
    return formatJson(data, meta);
  }

  const columns = Object.keys(firstItem).slice(0, 8); // Limit to 8 columns

  // Build table
  const table = new Table({
    head: columns.map((col) => truncate(col, 20)),
    wordWrap: true,
    wrapOnWordBoundary: false,
  });

  for (const item of data) {
    if (typeof item !== 'object' || item === null) continue;

    const row = columns.map((col) => {
      const value = (item as Record<string, unknown>)[col];
      return formatCellValue(value, 30);
    });

    table.push(row);
  }

  let output = table.toString();

  // Add metadata footer
  if (meta) {
    const showing = data.length;
    const total = meta.totalCount ?? showing;
    output += `\n\nTotal: ${total} items (showing ${showing})`;
  }

  return output;
}

/**
 * Format as YAML with optional metadata.
 */
function formatYaml(data: unknown, meta?: { filterCount?: number; totalCount?: number }): string {
  const output: Record<string, unknown> = { data };
  if (meta?.totalCount !== undefined) {
    output.meta = {
      // eslint-disable-next-line camelcase
      total_count: meta.totalCount,
      // eslint-disable-next-line camelcase
      ...(meta.filterCount !== undefined && { filter_count: meta.filterCount }),
    };
  }

  return YAML.stringify(output);
}

/**
 * Format a single cell value for table display.
 */
function formatCellValue(value: unknown, maxLength: number): string {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    // Truncate long strings
    return truncate(value, maxLength);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }

  if (typeof value === 'object') {
    return '{...}';
  }

  return String(value);
}

/**
 * Truncate a string to a maximum length.
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }

  return str.slice(0, maxLength - 3) + '...';
}
