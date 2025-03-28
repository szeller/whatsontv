/**
 * Tests for validation utilities
 */
import { describe, it, expect, jest } from '@jest/globals';
import { validateData, validateDataOrNull } from '../../utils/validationUtils.js';
import { z } from 'zod';

describe('Validation Utilities', () => {
  // Create a simple test schema
  const testSchema = z.object({
    id: z.number(),
    name: z.string()
  });

  // Mock console.error to avoid polluting test output
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validateData', () => {
    it('should return validated data for valid input', () => {
      const testData = { id: 1, name: 'Test' };
      const result = validateData(testSchema, testData);
      expect(result).toEqual(testData);
    });

    it('should throw error for invalid input', () => {
      const testData = { id: 'not-a-number', name: 'Test' };
      expect(() => validateData(testSchema, testData)).toThrow('Validation error');
    });

    it('should include custom error message when provided', () => {
      const testData = { id: 'not-a-number', name: 'Test' };
      expect(() => validateData(testSchema, testData, 'Custom error')).toThrow('Custom error');
    });
  });

  describe('validateDataOrNull', () => {
    it('should return validated data for valid input', () => {
      const testData = { id: 1, name: 'Test' };
      const result = validateDataOrNull(testSchema, testData);
      expect(result).toEqual(testData);
    });

    it('should return null for invalid input', () => {
      const testData = { id: 'not-a-number', name: 'Test' };
      const result = validateDataOrNull(testSchema, testData);
      expect(result).toBeNull();
    });
  });
});
