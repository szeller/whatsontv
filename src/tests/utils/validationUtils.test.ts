/**
 * Tests for validation utilities
 */
import { describe, it, expect, jest } from '@jest/globals';
import { validateData, validateDataOrNull, validateArray } from '../../utils/validationUtils.js';
import { z } from 'zod';

describe('Validation Utilities', () => {
  // Create a simple test schema
  const testSchema = z.object({
    id: z.number(),
    name: z.string()
  });

  // Mock console.error to avoid polluting test output
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { /* noop */ });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Reset environment variables
    delete process.env.NODE_ENV;
    delete process.env.JEST_WORKER_ID;
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

    it('should include detailed validation errors when includeDetails is true', () => {
      const testData = { id: 'not-a-number', name: 'Test' };
      expect(() => validateData(testSchema, testData, 'Validation error', true))
        .toThrow(/Validation error[\s\S]*id[\s\S]*number/);
    });

    it('should log validation errors in development environment', () => {
      // Set environment to development (not production, not test)
      process.env.NODE_ENV = 'development';
      delete process.env.JEST_WORKER_ID;
      
      const consoleSpy = jest.spyOn(console, 'error');
      const testData = { id: 'not-a-number', name: 'Test' };
      
      try {
        validateData(testSchema, testData);
      } catch {
        // Expected to throw
      }
      
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should not log validation errors in production environment', () => {
      process.env.NODE_ENV = 'production';
      
      const consoleSpy = jest.spyOn(console, 'error');
      const testData = { id: 'not-a-number', name: 'Test' };
      
      try {
        validateData(testSchema, testData);
      } catch {
        // Expected to throw
      }
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should not log validation errors in test environment (NODE_ENV=test)', () => {
      process.env.NODE_ENV = 'test';
      
      const consoleSpy = jest.spyOn(console, 'error');
      const testData = { id: 'not-a-number', name: 'Test' };
      
      try {
        validateData(testSchema, testData);
      } catch {
        // Expected to throw
      }
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should not log validation errors in test environment (JEST_WORKER_ID defined)', () => {
      delete process.env.NODE_ENV;
      process.env.JEST_WORKER_ID = '1';
      
      const consoleSpy = jest.spyOn(console, 'error');
      const testData = { id: 'not-a-number', name: 'Test' };
      
      try {
        validateData(testSchema, testData);
      } catch {
        // Expected to throw
      }
      
      expect(consoleSpy).not.toHaveBeenCalled();
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

    it('should log validation errors in development environment', () => {
      // Set environment to development (not production, not test)
      process.env.NODE_ENV = 'development';
      delete process.env.JEST_WORKER_ID;
      
      const consoleSpy = jest.spyOn(console, 'error');
      const testData = { id: 'not-a-number', name: 'Test' };
      
      validateDataOrNull(testSchema, testData);
      
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should not log validation errors in production environment', () => {
      process.env.NODE_ENV = 'production';
      
      const consoleSpy = jest.spyOn(console, 'error');
      const testData = { id: 'not-a-number', name: 'Test' };
      
      validateDataOrNull(testSchema, testData);
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('validateArray', () => {
    // Create a simple schema for array items
    const itemSchema = z.object({
      value: z.number()
    });

    it('should validate an array of valid items', () => {
      const testData = [
        { value: 1 },
        { value: 2 },
        { value: 3 }
      ];
      
      const result = validateArray(itemSchema, testData);
      expect(result).toEqual(testData);
    });

    it('should throw error for array with invalid items', () => {
      const testData = [
        { value: 1 },
        { value: 'not-a-number' as unknown as number }, // Invalid
        { value: 3 }
      ];
      
      expect(() => validateArray(itemSchema, testData))
        .toThrow('Array validation error');
    });

    it('should include custom error message when provided', () => {
      const testData = [
        { value: 1 },
        { value: 'not-a-number' as unknown as number }, // Invalid
        { value: 3 }
      ];
      
      expect(() => validateArray(itemSchema, testData, 'Custom array error'))
        .toThrow('Custom array error');
    });

    it('should include detailed validation errors when includeDetails is true', () => {
      const testData = [
        { value: 1 },
        { value: 'not-a-number' as unknown as number }, // Invalid
        { value: 3 }
      ];
      
      expect(() => validateArray(itemSchema, testData, 'Array validation error', true))
        .toThrow(/Array validation error[\s\S]*value[\s\S]*number/);
    });

    it('should validate an empty array', () => {
      const result = validateArray(itemSchema, []);
      expect(result).toEqual([]);
    });

    it('should throw error for non-array input', () => {
      const testData = { value: 1 }; // Not an array
      
      expect(() => validateArray(itemSchema, testData as unknown as unknown[]))
        .toThrow(/Array validation error/);
    });
  });
});
