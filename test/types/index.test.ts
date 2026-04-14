import { describe, expect, it } from 'vitest';
import { DirectusCliError } from '../../src/types/index.js';

describe('DirectusCliError', () => {
  describe('from', () => {
    it('returns same error if already DirectusCliError', () => {
      const original = new DirectusCliError('test', 400);
      const result = DirectusCliError.from(original);
      expect(result).toBe(original);
    });

    it('extracts message from Error', () => {
      const error = new Error('Something went wrong');
      const result = DirectusCliError.from(error);
      expect(result.message).toBe('Something went wrong');
    });

    it('extracts status code from error response', () => {
      const error = Object.assign(new Error('API Error'), {
        response: { data: {}, status: 404 },
      });
      const result = DirectusCliError.from(error);
      expect(result.statusCode).toBe(404);
    });

    it('extracts errors from Directus API response', () => {
      const error = Object.assign(new Error('API Error'), {
        response: {
          data: {
            errors: [{ extensions: { field: 'title' }, message: 'Field is required' }],
          },
          status: 400,
        },
      });
      const result = DirectusCliError.from(error);
      expect(result.errors).toHaveLength(1);
      expect(result.message).toBe('Field is required');
    });

    it('handles string error', () => {
      const result = DirectusCliError.from('string error');
      expect(result.message).toBe('string error');
    });
  });
});
