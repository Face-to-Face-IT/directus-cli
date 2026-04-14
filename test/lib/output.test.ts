import { describe, expect, it } from 'vitest';
import { formatOutput } from '../../src/lib/output.js';

describe('output', () => {
  describe('formatOutput', () => {
    const data = [
      { id: 1, status: 'published', title: 'First Post' },
      { id: 2, status: 'draft', title: 'Second Post' },
    ];

    it('formats as JSON by default', () => {
      const result = formatOutput(data, 'json', { totalCount: 100 });
      expect(JSON.parse(result)).toEqual({
        data,
        meta: { total_count: 100 },
      });
    });

    it('formats as table', () => {
      const result = formatOutput(data, 'table');
      // Table has ANSI colors, so we strip them for comparison or check for lowercase
      expect(result.toLowerCase()).toContain('id');
      expect(result.toLowerCase()).toContain('title');
      expect(result).toContain('First Post');
      expect(result).toContain('Second Post');
    });

    it('formats as YAML', () => {
      const result = formatOutput(data, 'yaml');
      expect(result).toContain('data:');
      expect(result).toContain('title: First Post');
    });

    it('includes metadata when provided', () => {
      const result = formatOutput(data, 'json', { filterCount: 50, totalCount: 100 });
      const parsed = JSON.parse(result);
      expect(parsed.meta.filter_count).toBe(50);
      expect(parsed.meta.total_count).toBe(100);
    });

    it('falls back to JSON for non-array data in table mode', () => {
      const singleItem = { id: 1, name: 'Test' };
      const result = formatOutput(singleItem, 'table');
      expect(JSON.parse(result)).toEqual({ data: singleItem });
    });

    it('handles empty array in table mode', () => {
      const result = formatOutput([], 'table', { totalCount: 0 });
      expect(result).toContain('No results');
    });
  });
});
