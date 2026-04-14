/**
 * Parse a filter expression from CLI input.
 * Supports:
 * - Raw JSON: '{"field":{"_eq":"value"}}'
 * - Shorthand equality: 'field=value'
 * - Shorthand not-equal: 'field!=value'
 *
 * Multiple filters (via multiple --filter flags) are combined with AND logic.
 */

/**
 * Directus filter type.
 */
export type Filter = Record<string, unknown>;

/**
 * Combine multiple filters with AND logic.
 */
export function combineFilters(filters: Filter[]): Filter | undefined {
  if (filters.length === 0) {
    return undefined;
  }

  if (filters.length === 1) {
    return filters[0];
  }

  return {_and: filters};
}

/**
 * Parse fields string into fields array.
 * Format: 'id,title,status' or 'id, title, status'
 */
export function parseFields(fieldsString: string): string[] {
  return fieldsString
  .split(',')
  .map(field => field.trim())
  .filter(Boolean);
}

/**
 * Parse a single filter expression.
 */
export function parseFilterExpression(expression: string): Filter {
  // Try JSON first
  if (expression.startsWith('{') || expression.startsWith('[')) {
    try {
      return JSON.parse(expression) as Filter;
    } catch {
      throw new Error(`Invalid JSON filter: ${expression}`);
    }
  }

  // Parse shorthand: field=value or field!=value
  const notEqualMatch = expression.match(/^([^!]+)!=(.+)$/);
  if (notEqualMatch) {
    const [, field, value] = notEqualMatch as [string, string, string];
    return {[field]: {_neq: parseValue(value)}};
  }

  const equalMatch = expression.match(/^([^=]+)=(.+)$/);
  if (equalMatch) {
    const [, field, value] = equalMatch as [string, string, string];
    return {[field]: {_eq: parseValue(value)}};
  }

  throw new Error(`Invalid filter expression: ${expression}. Use 'field=value' or JSON format.`);
}

/**
 * Parse sort string into sort array.
 * Format: 'field1,-field2,field3' where '-' prefix means descending
 */
export function parseSort(sortString: string): string[] {
  return sortString.split(',').map(field => field.trim());
}

/**
 * Parse a value string into the appropriate type.
 */
function parseValue(value: string): boolean | null | number | string {
  // Handle explicit null
  if (value === 'null') {
    return null;
  }

  // Handle boolean
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  // Handle numbers
  if (/^-?\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }

  if (/^-?\d+\.\d+$/.test(value)) {
    return Number.parseFloat(value);
  }

  // Default to string
  return value;
}
