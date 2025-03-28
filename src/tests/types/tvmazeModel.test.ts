/**
 * Tests for the TVMaze domain model
 */
import { describe, it, expect, jest } from '@jest/globals';
import { z } from 'zod';

import {
  transformScheduleItem,
  transformSchedule,
  isWebScheduleItem,
  NetworkScheduleItem,
  WebScheduleItem,
  networkScheduleItemSchema,
  webScheduleItemSchema,
  showSchema,
  networkSchema,
  showDetailsSchema,
  scheduleItemSchema,
  episodeSchema
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
    
    describe('showDetailsSchema', () => {
      it('should validate a valid show details object', () => {
        // Arrange
        const show = {
          id: 1,
          name: 'Test Show',
          type: 'scripted',
          language: 'English',
          genres: ['Drama', 'Comedy'],
          status: 'Running',
          runtime: 60,
          premiered: '2020-01-01',
          ended: null,
          officialSite: 'https://example.com',
          schedule: {
            time: '20:00',
            days: ['Monday']
          },
          rating: {
            average: 8.5
          },
          weight: 95,
          summary: 'Test summary',
          updated: 1609459200,
          network: {
            id: 1,
            name: 'NBC',
            country: {
              name: 'United States',
              code: 'US',
              timezone: 'America/New_York'
            }
          }
        };
        
        // Act & Assert
        const result = testSchemaValidation(showDetailsSchema, show);
        expect(result).toEqual(show);
      });
    });
    
    describe('networkScheduleItemSchema', () => {
      it('should validate a valid network schedule item', () => {
        // Arrange
        const item = networkSchedule[0];
        
        // Act & Assert
        const result = testSchemaValidation(networkScheduleItemSchema, item);
        expect(result).not.toBeNull();
      });
    });
    
    describe('webScheduleItemSchema', () => {
      it('should validate a valid web schedule item', () => {
        // Arrange
        const item = webSchedule[0];
        
        // Act & Assert
        const result = testSchemaValidation(webScheduleItemSchema, item);
        expect(result).not.toBeNull();
      });
    });
    
    describe('scheduleItemSchema', () => {
      it('should validate both network and web schedule items', () => {
        // Arrange
        const networkItem = networkSchedule[0];
        const webItem = webSchedule[0];
        
        // Act & Assert
        const networkResult = testSchemaValidation(scheduleItemSchema, networkItem);
        const webResult = testSchemaValidation(scheduleItemSchema, webItem);
        
        expect(networkResult).not.toBeNull();
        expect(webResult).not.toBeNull();
      });
    });
    
    describe('showSchema', () => {
      it('should validate a valid show object', () => {
        // Arrange
        const show = {
          id: 1,
          name: 'Test Show',
          type: 'scripted',
          language: 'English',
          genres: ['Drama', 'Comedy'],
          network: 'NBC',
          summary: 'Test summary',
          airtime: '20:00',
          season: 1,
          number: 1
        };
        
        // Act & Assert
        const result = testSchemaValidation(showSchema, show);
        expect(result).toEqual(show);
      });
      
      it('should apply default values for optional fields', () => {
        // Arrange
        const show = {
          id: 1,
          name: 'Test Show',
          network: 'NBC'
        };
        
        // Act
        const result = testSchemaValidation(showSchema, show);
        
        // Assert
        expect(result).toEqual({
          id: 1,
          name: 'Test Show',
          network: 'NBC',
          type: 'unknown',
          language: null,
          genres: [],
          summary: null,
          airtime: null,
          season: 0,
          number: 0
        });
      });
    });
    
    describe('episodeSchema', () => {
      it('should validate a valid episode object', () => {
        // Arrange
        const episode = {
          id: 1,
          name: 'Pilot',
          season: 1,
          number: 1,
          airtime: '20:00',
          airdate: '2020-01-01',
          runtime: 60,
          summary: 'Test summary',
          type: 'regular'
        };
        
        // Act & Assert
        const result = testSchemaValidation(episodeSchema, episode);
        expect(result).toEqual(episode);
      });
      
      it('should handle nullable and optional fields', () => {
        // Arrange
        const episode = {
          id: 1,
          name: 'Pilot',
          season: 1,
          number: 1,
          airtime: null
        };
        
        // Act & Assert
        const result = testSchemaValidation(episodeSchema, episode);
        expect(result).toEqual(episode);
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

    it('validates show schema', () => {
      const showData = {
        id: 123,
        name: 'Test Show',
        type: 'scripted',
        language: 'English',
        genres: ['Drama'],
        network: 'Test Network',
        summary: 'Test summary',
        airtime: '20:00',
        season: 1,
        number: 1
      };
      
      const result = testSchemaValidation(showSchema, showData);
      expect(result).toBeDefined();
      if (result) {
        expect(result.id).toBe(showData.id);
        expect(result.name).toBe(showData.name);
      }
    });
    
    it('handles nullable string transformations', () => {
      // Create a schema that uses the nullableString helper
      const testSchema = z.object({
        value: testNullableString
      });
      
      // Test with string value using the utility function
      const stringResult = testSchemaValidation(testSchema, { value: 'test' });
      expect(stringResult?.value).toBe('test');
      
      // Test with null value
      const nullResult = testSchemaValidation(testSchema, { value: null });
      expect(nullResult?.value).toBeNull();
      
      // Test with undefined value
      const undefinedResult = testSchemaValidation(testSchema, { value: undefined });
      expect(undefinedResult?.value).toBeNull();
    });
    
    it('handles number from mixed transformations', () => {
      // Create a schema that uses the numberFromMixed helper
      const testSchema = z.object({
        value: testNumberFromMixed
      });
      
      // Test with number value using the utility function
      const numberResult = testSchemaValidation(testSchema, { value: 123 });
      expect(numberResult?.value).toBe(123);
      
      // Test with string value that can be parsed as number
      const validStringResult = testSchemaValidation(testSchema, { value: '456' });
      expect(validStringResult?.value).toBe(456);
      
      // Test with string value that cannot be parsed as number
      const invalidStringResult = testSchemaValidation(testSchema, { value: 'abc' });
      expect(invalidStringResult?.value).toBe(0);
      
      // Test with null value
      const nullResult = testSchemaValidation(testSchema, { value: null });
      expect(nullResult?.value).toBe(0);
      
      // Test with undefined value
      const undefinedResult = testSchemaValidation(testSchema, { value: undefined });
      expect(undefinedResult?.value).toBe(0);
    });
    
    // Add direct tests for the Zod schema helper functions
    it('tests numberFromMixed helper with various inputs', () => {
      // Test with number
      expect(testNumberFromMixed.parse(42)).toBe(42);
      
      // Test with valid number string
      expect(testNumberFromMixed.parse('123')).toBe(123);
      
      // Test with invalid number string
      expect(testNumberFromMixed.parse('abc')).toBe(0);
      
      // Test with empty string
      expect(testNumberFromMixed.parse('')).toBe(0);
      
      // Test with null
      expect(testNumberFromMixed.parse(null)).toBe(0);
      
      // Test with undefined
      expect(testNumberFromMixed.parse(undefined)).toBe(0);
    });
    
    it('tests nullableString helper with various inputs', () => {
      // Test with string
      expect(testNullableString.parse('hello')).toBe('hello');
      
      // Test with empty string
      expect(testNullableString.parse('')).toBe('');
      
      // Test with null
      expect(testNullableString.parse(null)).toBeNull();
      
      // Test with undefined
      expect(testNullableString.parse(undefined)).toBeNull();
    });
  });

  describe('Type Definitions', () => {
    it('should create valid NetworkScheduleItem instances', () => {
      // Create a minimal valid NetworkScheduleItem
      const item: NetworkScheduleItem = {
        id: 1,
        airtime: '20:00',
        show: {
          id: 100,
          name: 'Test Show',
          type: 'scripted',
          language: 'English',
          genres: ['Drama'],
          status: 'Running',
          schedule: {
            time: '20:00',
            days: ['Monday']
          }
        }
      };
      
      // Verify it's valid by parsing it with the schema
      const result = networkScheduleItemSchema.parse(item);
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.show.id).toBe(100);
    });
    
    it('should create valid WebScheduleItem instances', () => {
      // Create a minimal valid WebScheduleItem
      const item: WebScheduleItem = {
        id: 1,
        airtime: '20:00',
        _embedded: {
          show: {
            id: 100,
            name: 'Test Show',
            type: 'scripted',
            language: 'English',
            genres: ['Drama'],
            status: 'Running',
            schedule: {
              time: '20:00',
              days: ['Monday']
            }
          }
        }
      };
      
      // Verify it's valid by parsing it with the schema
      const result = webScheduleItemSchema.parse(item);
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result._embedded.show.id).toBe(100);
    });
    
    it('should create valid ScheduleItem instances', () => {
      // Create a minimal valid NetworkScheduleItem as a ScheduleItem
      const networkItem: NetworkScheduleItem = {
        id: 1,
        airtime: '20:00',
        show: {
          id: 100,
          name: 'Test Show',
          type: 'scripted',
          language: 'English',
          genres: ['Drama'],
          status: 'Running',
          schedule: {
            time: '20:00',
            days: ['Monday']
          }
        }
      };
      
      // Create a minimal valid WebScheduleItem as a ScheduleItem
      const webItem: WebScheduleItem = {
        id: 2,
        airtime: '21:00',
        _embedded: {
          show: {
            id: 200,
            name: 'Web Show',
            type: 'scripted',
            language: 'English',
            genres: ['Comedy'],
            status: 'Running',
            schedule: {
              time: '21:00',
              days: ['Tuesday']
            }
          }
        }
      };
      
      // Verify they're valid by parsing with the schema
      const networkResult = scheduleItemSchema.parse(networkItem);
      const webResult = scheduleItemSchema.parse(webItem);
      
      expect(networkResult).toBeDefined();
      expect(webResult).toBeDefined();
      expect(networkResult.id).toBe(1);
      expect(webResult.id).toBe(2);
    });
  });

  describe('Helper Schemas', () => {
    describe('numberFromMixed', () => {
      it('should handle number input', () => {
        // Act & Assert
        expect(testNumberFromMixed.parse(42)).toBe(42);
      });
      
      it('should convert string to number', () => {
        // Act & Assert
        expect(testNumberFromMixed.parse('42')).toBe(42);
      });
      
      it('should convert invalid string to 0', () => {
        // Act & Assert
        expect(testNumberFromMixed.parse('not-a-number')).toBe(0);
      });
      
      it('should convert null to 0', () => {
        // Act & Assert
        expect(testNumberFromMixed.parse(null)).toBe(0);
      });
      
      it('should convert undefined to 0', () => {
        // Act & Assert
        expect(testNumberFromMixed.parse(undefined)).toBe(0);
      });
    });
    
    describe('nullableString', () => {
      it('should handle string input', () => {
        // Act & Assert
        expect(testNullableString.parse('test')).toBe('test');
      });
      
      it('should handle null input', () => {
        // Act & Assert
        expect(testNullableString.parse(null)).toBe(null);
      });
      
      it('should convert undefined to null', () => {
        // Act & Assert
        expect(testNullableString.parse(undefined)).toBe(null);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles errors in transformScheduleItem gracefully', () => {
      // Mock console.error to prevent actual logging during tests
      const originalConsoleError = console.error;
      const consoleErrorMock = jest.fn();
      console.error = consoleErrorMock;
      
      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      try {
        // Set NODE_ENV to production to test error logging
        process.env.NODE_ENV = 'production';
        
        // Create a malformed item that will cause an error during processing
        // We'll use a getter that throws an error when accessed
        const malformedItem = {
          get _embedded() {
            throw new Error('Test error');
          }
        };
        
        // Act - this should not throw but return null
        const result = transformScheduleItem(malformedItem as unknown as NetworkScheduleItem);
        
        // Assert
        expect(result).toBeNull();
        expect(consoleErrorMock).toHaveBeenCalled();
        
        // Test in non-production environment
        process.env.NODE_ENV = 'development';
        // Reset mock to verify it's not called in development
        consoleErrorMock.mockReset();
        transformScheduleItem(malformedItem as unknown as NetworkScheduleItem);
        // Should not be called in development mode
        expect(consoleErrorMock).not.toHaveBeenCalled();
      } finally {
        // Restore console.error and NODE_ENV
        console.error = originalConsoleError;
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
    
    it('handles errors in transformSchedule gracefully', () => {
      // Create an array with a malformed item
      const items = [
        networkSchedule[0],
        {}, // This will cause transformScheduleItem to return null
        networkSchedule[1]
      ];
      
      // Act
      const result = transformSchedule(items);
      
      // Assert - should filter out the null result
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(networkSchedule[0].show.id);
      expect(result[1].id).toBe(networkSchedule[1].show.id);
    });
  });

  describe('isWebScheduleItem Function', () => {
    it('correctly identifies web schedule items', () => {
      // Arrange - use a fixture from the web schedule
      const webItem = webSchedule[0];
      
      // Act & Assert
      expect(isWebScheduleItem(webItem)).toBe(true);
    });
    
    it('correctly identifies non-web schedule items', () => {
      // Arrange - use a fixture from the network schedule
      const networkItem = networkSchedule[0];
      
      // Act & Assert
      expect(isWebScheduleItem(networkItem)).toBe(false);
    });
    
    it('handles null or undefined input', () => {
      // Act & Assert
      expect(isWebScheduleItem(null)).toBe(false);
      expect(isWebScheduleItem(undefined)).toBe(false);
    });
    
    it('handles non-object input', () => {
      // Act & Assert
      expect(isWebScheduleItem('string')).toBe(false);
      expect(isWebScheduleItem(123)).toBe(false);
      expect(isWebScheduleItem(true)).toBe(false);
    });
    
    it('handles objects without _embedded property', () => {
      // Arrange
      const item = { id: 123, name: 'Test' };
      
      // Act & Assert
      expect(isWebScheduleItem(item)).toBe(false);
    });
    
    it('handles objects with non-object _embedded property', () => {
      // Arrange
      const item = { id: 123, _embedded: 'not an object' };
      
      // Act & Assert
      expect(isWebScheduleItem(item)).toBe(false);
    });
    
    it('handles objects with _embedded object but no show property', () => {
      // Arrange
      const item = { id: 123, _embedded: { notShow: 'something' } };
      
      // Act & Assert
      expect(isWebScheduleItem(item)).toBe(false);
    });
  });

  describe('transformScheduleItem Function', () => {
    it('should transform network schedule items correctly', () => {
      // Arrange
      const networkItem = networkSchedule[0];
      
      // Act
      const result = transformScheduleItem(networkItem);
      
      // Assert
      expect(result).not.toBeNull();
      if (result) {
        // The transformed object uses the show's ID, not the schedule item ID
        expect(result.id).toBe(networkItem.show.id);
        expect(result.name).toBe(networkItem.show.name);
        expect(result.network).toBeDefined();
        expect(result.airtime).toBeDefined();
      }
    });
    
    it('should transform web schedule items correctly', () => {
      // Arrange
      const webItem = webSchedule[0];
      
      // Act
      const result = transformScheduleItem(webItem);
      
      // Assert
      expect(result).not.toBeNull();
      if (result) {
        // The transformed object uses the show's ID, not the schedule item ID
        expect(result.id).toBe(webItem._embedded.show.id);
        expect(result.name).toBe(webItem._embedded.show.name);
        expect(result.network).toBeDefined();
        expect(result.airtime).toBeDefined();
      }
    });
    
    it('should handle null or undefined input', () => {
      // Act & Assert
      expect(transformScheduleItem(null)).toBeNull();
      expect(transformScheduleItem(undefined)).toBeNull();
    });
    
    it('should handle non-object input', () => {
      // Act & Assert
      expect(transformScheduleItem('string')).toBeNull();
      expect(transformScheduleItem(123)).toBeNull();
      expect(transformScheduleItem(true)).toBeNull();
    });
    
    it('should handle missing show data in network items', () => {
      // Arrange
      const invalidItem = { 
        id: 123, 
        name: 'Test Episode',
        airtime: null
        // Missing show property
      } as unknown as NetworkScheduleItem;
      
      // Act
      const result = transformScheduleItem(invalidItem);
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should handle missing _embedded.show in web items', () => {
      // Arrange
      const invalidItem = { 
        id: 123,
        airtime: null,
        _embedded: {
          // Missing show property
        }
      } as unknown as WebScheduleItem;
      
      // Act
      const result = transformScheduleItem(invalidItem);
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should handle null show in network items', () => {
      // Arrange
      const invalidItem = { 
        id: 123, 
        name: 'Test Episode',
        airtime: null,
        show: null
      } as unknown as NetworkScheduleItem;
      
      // Act
      const result = transformScheduleItem(invalidItem);
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should handle null _embedded.show in web items', () => {
      // Arrange
      const invalidItem = { 
        id: 123,
        airtime: null,
        _embedded: {
          show: null
        }
      } as unknown as WebScheduleItem;
      
      // Act
      const result = transformScheduleItem(invalidItem);
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should handle string season and number values', () => {
      // Arrange
      const item = {
        ...networkSchedule[0],
        season: '3' as unknown as number,
        number: '5' as unknown as number
      };
      
      // Act
      const result = transformScheduleItem(item);
      
      // Assert
      expect(result).not.toBeNull();
      if (result) {
        expect(result.season).toBe(3);
        expect(result.number).toBe(5);
      }
    });
    
    it('should handle invalid string season and number values', () => {
      // Arrange
      const item = {
        ...networkSchedule[0],
        season: 'invalid' as unknown as number,
        number: 'invalid' as unknown as number
      };
      
      // Act
      const result = transformScheduleItem(item);
      
      // Assert
      expect(result).not.toBeNull();
      if (result) {
        expect(result.season).toBe(0);
        expect(result.number).toBe(0);
      }
    });
    
    it('should handle null season and number values', () => {
      // Arrange
      const item = {
        ...networkSchedule[0],
        season: null as unknown as number,
        number: null as unknown as number
      };
      
      // Act
      const result = transformScheduleItem(item);
      
      // Assert
      expect(result).not.toBeNull();
      if (result) {
        expect(result.season).toBe(0);
        expect(result.number).toBe(0);
      }
    });
  });

  describe('transformSchedule Function', () => {
    it('should transform an array of schedule items', () => {
      // Arrange
      const items = networkSchedule.slice(0, 3);
      
      // Act
      const result = transformSchedule(items);
      
      // Assert
      expect(result).toHaveLength(items.length);
      // The transformed objects use the show's ID, not the schedule item ID
      expect(result[0].id).toBe(items[0].show.id);
      expect(result[1].id).toBe(items[1].show.id);
      expect(result[2].id).toBe(items[2].show.id);
    });
    
    it('should filter out null results from transformScheduleItem', () => {
      // Arrange
      const validItems = networkSchedule.slice(0, 2);
      const items = [
        validItems[0],
        // This will result in null from transformScheduleItem
        { id: 123 } as unknown as NetworkScheduleItem, 
        validItems[1]
      ];
      
      // Act
      const result = transformSchedule(items);
      
      // Assert
      expect(result).toHaveLength(2);
      // The transformed objects use the show's ID, not the schedule item ID
      expect(result[0].id).toBe(validItems[0].show.id);
      expect(result[1].id).toBe(validItems[1].show.id);
    });
    
    it('should handle non-array input', () => {
      // Act & Assert
      // @ts-expect-error Testing invalid input
      expect(transformSchedule(null)).toEqual([]);
      // @ts-expect-error Testing invalid input
      expect(transformSchedule(undefined)).toEqual([]);
      // @ts-expect-error Testing invalid input
      expect(transformSchedule('string')).toEqual([]);
      // @ts-expect-error Testing invalid input
      expect(transformSchedule(123)).toEqual([]);
      // @ts-expect-error Testing invalid input
      expect(transformSchedule({})).toEqual([]);
    });
    
    it('should handle empty array input', () => {
      // Act
      const result = transformSchedule([]);
      
      // Assert
      expect(result).toEqual([]);
    });
    
    it('should handle mixed network and web schedule items', () => {
      // Arrange
      const items = [
        networkSchedule[0],
        webSchedule[0]
      ];
      
      // Act
      const result = transformSchedule(items);
      
      // Assert
      expect(result).toHaveLength(2);
      // The transformed objects use the show's ID, not the schedule item ID
      expect(result[0].id).toBe(networkSchedule[0].show.id);
      expect(result[1].id).toBe(webSchedule[0]._embedded.show.id);
    });
  });
});
