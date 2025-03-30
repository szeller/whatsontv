/**
 * Tests for HTTP schemas
 */
import { describe, it, expect } from '@jest/globals';
import { requestOptionsSchema, httpResponseSchema } from '../../schemas/http';
import type { RequestOptions } from '../../schemas/http';

describe('HTTP Schemas', () => {
  describe('requestOptionsSchema', () => {
    it('should validate a valid request options object', () => {
      // Arrange
      const validOptions = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 5000,
        query: {
          page: 1,
          limit: 10,
          filter: 'active',
          includeDetails: true
        }
      };

      // Act
      const result = requestOptionsSchema.safeParse(validOptions);

      // Assert
      expect(result.success).toBe(true);
      if (result.success === true) {
        expect(result.data).toEqual(validOptions);
      }
    });

    it('should validate with optional fields missing', () => {
      // Arrange
      const minimalOptions = {};

      // Act
      const result = requestOptionsSchema.safeParse(minimalOptions);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should reject invalid timeout value', () => {
      // Arrange
      const invalidOptions = {
        timeout: -1000 // Negative timeout is invalid
      };

      // Act
      const result = requestOptionsSchema.safeParse(invalidOptions);

      // Assert
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error.issues[0].path).toContain('timeout');
      }
    });

    it('should reject invalid headers type', () => {
      // Arrange
      const invalidOptions = {
        headers: ['invalid', 'array', 'type'] // Headers should be an object
      };

      // Act
      const result = requestOptionsSchema.safeParse(invalidOptions);

      // Assert
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error.issues[0].path).toContain('headers');
      }
    });

    it('should reject invalid query parameter types', () => {
      // Arrange
      const invalidOptions = {
        query: {
          complex: { nested: 'object' } // Complex objects not allowed
        }
      };

      // Act
      const result = requestOptionsSchema.safeParse(invalidOptions);

      // Assert
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error.issues[0].path).toContain('query');
      }
    });
  });

  describe('httpResponseSchema', () => {
    it('should validate a valid HTTP response', () => {
      // Arrange
      const validResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json'
        },
        body: { data: 'test response' }
      };

      // Act
      const result = httpResponseSchema.safeParse(validResponse);

      // Assert
      expect(result.success).toBe(true);
      if (result.success === true) {
        expect(result.data).toEqual(validResponse);
      }
    });

    it('should validate with minimal required fields', () => {
      // Arrange
      const minimalResponse = {
        status: 204,
        body: null
      };

      // Act
      const result = httpResponseSchema.safeParse(minimalResponse);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      // Arrange
      const invalidResponse = {
        statusText: 'Bad Request',
        body: { error: 'Invalid request' }
        // Missing status field
      };

      // Act
      const result = httpResponseSchema.safeParse(invalidResponse);

      // Assert
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error.issues[0].path).toContain('status');
      }
    });

    it('should reject invalid status type', () => {
      // Arrange
      const invalidResponse = {
        status: '200', // Status should be a number
        body: {}
      };

      // Act
      const result = httpResponseSchema.safeParse(invalidResponse);

      // Assert
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error.issues[0].path).toContain('status');
      }
    });
  });

  describe('RequestOptions type', () => {
    it('should be correctly inferred from the schema', () => {
      // This is a type-level test
      // We're creating a valid RequestOptions object to ensure the type is correctly inferred
      const options: RequestOptions = {
        headers: {
          'Authorization': 'Bearer token'
        },
        timeout: 3000,
        query: {
          search: 'test',
          page: 1
        }
      };

      // Just assert that we can create this object without type errors
      expect(options).toBeDefined();
      expect(options.headers?.Authorization).toBe('Bearer token');
    });
  });
});
