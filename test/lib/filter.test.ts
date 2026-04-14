import { describe, expect, it } from 'vitest';
import { combineFilters, parseFields, parseFilterExpression, parseSort } from '../../src/lib/filter.js';

describe('filter', () => {
  describe('parseFilterExpression', () => {
    it('parses JSON filter', () => {
      const result = parseFilterExpression('{"status":{"_eq":"published"}}');
      expect(result).toEqual({ status: { _eq: 'published' } });
    });

    it('parses shorthand equality', () => {
      const result = parseFilterExpression('status=published');
      expect(result).toEqual({ status: { _eq: 'published' } });
    });

    it('parses shorthand not-equal', () => {
      const result = parseFilterExpression('status!=draft');
      expect(result).toEqual({ status: { _neq: 'draft' } });
    });

    it('parses numeric values', () => {
      const result = parseFilterExpression('id=123');
      expect(result).toEqual({ id: { _eq: 123 } });
    });

    it('parses boolean values', () => {
      expect(parseFilterExpression('active=true')).toEqual({ active: { _eq: true } });
      expect(parseFilterExpression('active=false')).toEqual({ active: { _eq: false } });
    });

    it('parses null values', () => {
      const result = parseFilterExpression('deleted=null');
      expect(result).toEqual({ deleted: { _eq: null } });
    });

    it('throws on invalid expression', () => {
      expect(() => parseFilterExpression('invalid')).toThrow();
    });
  });

  describe('combineFilters', () => {
    it('returns undefined for empty array', () => {
      expect(combineFilters([])).toBeUndefined();
    });

    it('returns single filter as-is', () => {
      const filter = { status: { _eq: 'published' } };
      expect(combineFilters([filter])).toEqual(filter);
    });

    it('combines multiple filters with AND', () => {
      const filters = [{ status: { _eq: 'published' } }, { category: { _eq: 'news' } }];
      expect(combineFilters(filters)).toEqual({
        _and: [{ status: { _eq: 'published' } }, { category: { _eq: 'news' } }],
      });
    });
  });

  describe('parseSort', () => {
    it('parses single field', () => {
      expect(parseSort('title')).toEqual(['title']);
    });

    it('parses multiple fields', () => {
      expect(parseSort('date_created,title')).toEqual(['date_created', 'title']);
    });

    it('handles descending prefix', () => {
      expect(parseSort('-date_created,title')).toEqual(['-date_created', 'title']);
    });
  });

  describe('parseFields', () => {
    it('parses comma-separated fields', () => {
      expect(parseFields('id,title,status')).toEqual(['id', 'title', 'status']);
    });

    it('handles spaces after commas', () => {
      expect(parseFields('id, title, status')).toEqual(['id', 'title', 'status']);
    });

    it('filters empty strings', () => {
      expect(parseFields('id,,title')).toEqual(['id', 'title']);
    });
  });
});
