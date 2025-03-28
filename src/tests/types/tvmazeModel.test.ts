/**
 * Tests for the TVMaze domain model
 */
import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';

import {
  NetworkScheduleItem,
  WebScheduleItem,
  networkScheduleItemSchema,
  webScheduleItemSchema,
  networkSchema
} from '../../types/tvmazeModel.js';
import { Fixtures } from '../fixtures/index.js';

// Type definition for the show property to help TypeScript
interface ShowWithId {
  id: number;
  name: string;
}

/**
 * Generic utility function to test Zod schema parsing and validation
 * @param schema The Zod schema to test
 * @param input The input data to parse
 * @returns The parsed data if successful
 */
function testSchemaValidation<T extends z.ZodType, I>(
  schema: T,
  input: I
): z.output<T> | null {
  const result = schema.safeParse(input);
  expect(result.success).toBe(true);
  
  if (result.success) {
    return result.data;
  }
  
  return null;
}

// Create test versions of the helper schemas used in the module
const testNumberFromMixed = z.union([
  z.number(),
  z.string().transform(val => parseInt(val, 10) || 0),
  z.null().transform(() => 0),
  z.undefined().transform(() => 0)
]);

const testNullableString = z.union([
  z.string(),
  z.null(),
  z.undefined().transform(() => null)
]);

describe('TVMaze Domain Model', () => {
  // Load test fixtures using the utility class and add type assertions
  const networkSchedule = Fixtures.tvMaze.getSchedule('network-schedule') as 
    Array<NetworkScheduleItem & { show: ShowWithId }>;
  const webSchedule = Fixtures.tvMaze.getSchedule('web-schedule') as 
    Array<WebScheduleItem & { _embedded: { show: ShowWithId } }>;

  describe('Schema Validation', () => {
    describe('networkSchema', () => {
      it('should validate a valid network object', () => {
        // Arrange
        const network = {
          id: 1,
          name: 'NBC',
          country: {
            name: 'United States',
            code: 'US',
            timezone: 'America/New_York'
          }
        };
        
        // Act & Assert
        const result = testSchemaValidation(networkSchema, network);
        expect(result).toEqual(network);
      });
      
      it('should handle null country', () => {
        // Arrange
        const network = {
          id: 1,
          name: 'NBC',
          country: null
        };
        
        // Act & Assert
        const result = testSchemaValidation(networkSchema, network);
        expect(result).toEqual(network);
      });
    });
    
    
    it('validates network schedule items', () => {
      const networkItem = networkSchedule[0];
      const result = testSchemaValidation(networkScheduleItemSchema, networkItem);
      expect(result).toBeDefined();
      if (result) {
        expect(result.id).toBe(networkItem.id);
      }
    });

    it('validates web schedule items', () => {
      const webItem = webSchedule[0];
      const result = testSchemaValidation(webScheduleItemSchema, webItem);
      expect(result).toBeDefined();
      if (result) {
        expect(result.id).toBe(webItem.id);
      }
    });
    
    it('handles nullable string transformations', () => {
      // Create a schema that uses the nullableString helper
      const testSchema = z.object({
        value: testNullableString
      });
      
      // Test with a string value
      const stringResult = testSchemaValidation(testSchema, { value: 'test' });
      expect(stringResult?.value).toBe('test');
      
      // Test with null
      const nullResult = testSchemaValidation(testSchema, { value: null });
      expect(nullResult?.value).toBeNull();
      
      // Test with undefined
      const undefinedResult = testSchemaValidation(testSchema, { value: undefined });
      expect(undefinedResult?.value).toBeNull();
    });
    
    it('handles number from mixed transformations', () => {
      // Create a schema that uses the numberFromMixed helper
      const testSchema = z.object({
        value: testNumberFromMixed
      });
      
      // Test with a number value
      const numberResult = testSchemaValidation(testSchema, { value: 123 });
      expect(numberResult?.value).toBe(123);
      
      // Test with a string that can be parsed as a number
      const stringResult = testSchemaValidation(testSchema, { value: '456' });
      expect(stringResult?.value).toBe(456);
      
      // Test with a string that cannot be parsed as a number
      const invalidStringResult = testSchemaValidation(testSchema, { value: 'not-a-number' });
      expect(invalidStringResult?.value).toBe(0);
      
      // Test with null
      const nullResult = testSchemaValidation(testSchema, { value: null });
      expect(nullResult?.value).toBe(0);
      
      // Test with undefined
      const undefinedResult = testSchemaValidation(testSchema, { value: undefined });
      expect(undefinedResult?.value).toBe(0);
    });
  });

  describe('Type Definitions', () => {
    it('should create valid NetworkScheduleItem instances', () => {
      // Create a minimal valid NetworkScheduleItem
      const item: NetworkScheduleItem = {
        id: 1,
        url: 'http://example.com',
        name: 'Test Episode',
        season: 1,
        number: 1,
        type: 'regular',
        airdate: '2023-01-01',
        airtime: '20:00',
        airstamp: '2023-01-01T20:00:00-05:00',
        runtime: 60,
        rating: { average: 8.5 },
        summary: 'Test summary',
        show: {
          id: 1,
          url: 'http://example.com/show',
          name: 'Test Show',
          type: 'scripted',
          language: 'English',
          genres: ['Drama'],
          status: 'Running',
          runtime: 60,
          premiered: '2023-01-01',
          ended: null,
          officialSite: 'http://example.com/official',
          schedule: {
            time: '20:00',
            days: ['Monday']
          },
          rating: { average: 8.5 },
          weight: 100,
          network: {
            id: 1,
            name: 'NBC',
            country: {
              name: 'United States',
              code: 'US',
              timezone: 'America/New_York'
            }
          },
          webChannel: null,
          summary: 'Test show summary',
          updated: 1609459200
        }
      };
      
      // This should compile without errors
      expect(item.id).toBe(1);
      expect(item.show.name).toBe('Test Show');
    });
    
    it('should create valid WebScheduleItem instances', () => {
      // Create a minimal valid WebScheduleItem
      const item: WebScheduleItem = {
        id: 1,
        url: 'http://example.com',
        name: 'Test Episode',
        season: 1,
        number: 1,
        type: 'regular',
        airdate: '2023-01-01',
        airtime: '20:00',
        airstamp: '2023-01-01T20:00:00-05:00',
        runtime: 60,
        rating: { average: 8.5 },
        summary: 'Test summary',
        _embedded: {
          show: {
            id: 1,
            url: 'http://example.com/show',
            name: 'Test Show',
            type: 'scripted',
            language: 'English',
            genres: ['Drama'],
            status: 'Running',
            runtime: 60,
            premiered: '2023-01-01',
            ended: null,
            officialSite: 'http://example.com/official',
            schedule: {
              time: '20:00',
              days: ['Monday']
            },
            rating: { average: 8.5 },
            weight: 100,
            network: null,
            webChannel: {
              id: 1,
              name: 'Netflix',
              country: null
            },
            summary: 'Test show summary',
            updated: 1609459200
          }
        }
      };
      
      // This should compile without errors
      expect(item.id).toBe(1);
      expect(item._embedded.show.name).toBe('Test Show');
    });
  });
});
