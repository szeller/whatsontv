/**
 * Tests for the TVMaze domain model
 */
import { describe, it, expect } from '@jest/globals';

import {
  transformScheduleItem,
  transformSchedule,
  networkScheduleItemSchema,
  webScheduleItemSchema,
  showSchema
} from '../../types/tvmazeModel.js';
import { TvMazeFixtures } from '../fixtures/tvmaze/tvMazeFixtures.js';

describe('TVMaze Domain Model', () => {
  // Load test fixtures using the utility class
  const networkSchedule = TvMazeFixtures.getNetworkSchedule();
  const webSchedule = TvMazeFixtures.getWebSchedule();
  const combinedSchedule = TvMazeFixtures.getCombinedSchedule();

  describe('Schema Validation', () => {
    it('validates network schedule items', () => {
      const networkItem = networkSchedule[0];
      const result = networkScheduleItemSchema.safeParse(networkItem);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.id).toBeDefined();
        expect(result.data.show).toBeDefined();
      }
    });

    it('validates web schedule items', () => {
      const webItem = webSchedule[0];
      const result = webScheduleItemSchema.safeParse(webItem);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const data = result.data as { id: number; _embedded: { show: unknown } };
        expect(data.id).toBeDefined();
        expect(data._embedded).toBeDefined();
        expect(data._embedded.show).toBeDefined();
      }
    });

    it('handles missing or null values', () => {
      const incompleteItem = {
        id: 123,
        name: 'Test Show',
        airtime: null,
        show: {
          id: 456,
          name: 'Parent Show',
          type: 'regular',
          language: null,
          genres: [],
          network: null,
          webChannel: null,
          summary: null
        }
      };
      
      const result = networkScheduleItemSchema.safeParse(incompleteItem);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.airtime).toBeNull();
      }
    });
  });

  describe('Transformation Functions', () => {
    it('transforms network schedule items correctly', () => {
      const networkItem = networkSchedule[0];
      const transformed = transformScheduleItem(networkItem);
      
      // Check that transformation succeeded
      expect(transformed).not.toBeNull();
      
      if (transformed) {
        expect(transformed).toMatchObject({
          id: expect.any(Number),
          name: expect.any(String),
          network: expect.any(String),
          season: expect.any(Number),
          number: expect.any(Number)
        });
        
        // Validate against our schema
        const validation = showSchema.safeParse(transformed);
        expect(validation.success).toBe(true);
      }
    });

    it('transforms web schedule items correctly', () => {
      const webItem = webSchedule[0];
      const transformed = transformScheduleItem(webItem);
      
      // Check that transformation succeeded
      expect(transformed).not.toBeNull();
      
      if (transformed) {
        expect(transformed).toMatchObject({
          id: expect.any(Number),
          name: expect.any(String),
          network: expect.any(String),
          season: expect.any(Number),
          number: expect.any(Number)
        });
        
        // Validate against our schema
        const validation = showSchema.safeParse(transformed);
        expect(validation.success).toBe(true);
      }
    });

    it('transforms a mixed schedule correctly', () => {
      // Transform the combined schedule
      const transformed = transformSchedule(combinedSchedule);
      
      // We expect some shows to be filtered out if they don't have valid data
      expect(transformed.length).toBeGreaterThan(0);
      expect(transformed.length).toBeLessThanOrEqual(combinedSchedule.length);
      
      // Manually split the schedule into two parts for testing
      const webScheduleShows = transformSchedule(webSchedule);
      const networkScheduleShows = transformSchedule(networkSchedule);
      
      // Verify we have shows from both sources
      expect(webScheduleShows.length).toBeGreaterThan(0);
      expect(networkScheduleShows.length).toBeGreaterThan(0);
      
      // Validate all transformed shows
      transformed.forEach(show => {
        // Ensure season and number are numbers
        const processedShow = {
          ...show,
          season: typeof show.season === 'string' ? parseInt(show.season, 10) : show.season,
          number: typeof show.number === 'string' ? parseInt(show.number, 10) : show.number
        };
        
        const validation = showSchema.safeParse(processedShow);
        if (!validation.success) {
          console.error('Validation failed for show:', processedShow);
          console.error('Validation errors:', validation.error);
        }
        expect(validation.success).toBe(true);
      });
    });

    it('handles conversion of string numbers to numeric values', () => {
      const itemWithStringValues = {
        ...networkSchedule[0],
        season: '5',
        number: '10'
      };
      
      const transformed = transformScheduleItem(itemWithStringValues);
      
      // Check that transformation succeeded
      expect(transformed).not.toBeNull();
      
      if (transformed) {
        expect(typeof transformed.season).toBe('number');
        expect(transformed.season).toBe(5);
        expect(typeof transformed.number).toBe('number');
        expect(transformed.number).toBe(10);
      }
    });

    it('handles missing values gracefully', () => {
      // Create a minimal item with just an ID to test default values
      const incompleteItem = {
        id: 123,
        // We need to add the minimum structure expected by our schema
        show: {
          id: 123,
          name: ''
          // Other fields will be defaulted
        }
      };
      
      // Should not throw an error for incomplete data
      const transformed = transformScheduleItem(incompleteItem);
      
      // Check that transformation succeeded
      expect(transformed).not.toBeNull();
      
      if (transformed) {
        // Should return a valid show object with default values
        expect(transformed.id).toBe(123);
        expect(transformed.name).toBe('');
        expect(transformed.network).toBe('Unknown Network');
        expect(transformed.season).toBe(0);
        expect(transformed.number).toBe(0);
      }
    });

    it('correctly identifies network vs streaming shows based on structure', () => {
      // Create a network show (from /schedule endpoint)
      const networkItem = {
        id: 1001,
        airtime: '20:00',
        season: 1,
        number: 2,
        show: {
          id: 1001,
          name: 'Network Show',
          type: 'Scripted',
          network: {
            name: 'ABC',
            country: { code: 'US' }
          }
        }
      };
      
      // Create a streaming show (from /schedule/web endpoint)
      const streamingItem = {
        id: 2001,
        airtime: '',
        season: 2,
        number: 3,
        _embedded: {
          show: {
            id: 2001,
            name: 'Streaming Show',
            type: 'Scripted',
            webChannel: {
              name: 'Netflix'
            }
          }
        }
      };
      
      const networkTransformed = transformScheduleItem(networkItem);
      const streamingTransformed = transformScheduleItem(streamingItem);
      
      expect(networkTransformed).not.toBeNull();
      expect(streamingTransformed).not.toBeNull();
      
      if (networkTransformed && streamingTransformed) {
        // Network show should have the network name with country code
        expect(networkTransformed.network).toBe('ABC (US)');
        
        // Streaming show should have just the webChannel name
        expect(streamingTransformed.network).toBe('Netflix');
      }
    });

    it('handles invalid input gracefully', () => {
      // Test with various invalid inputs
      expect(transformScheduleItem(null)).toBeNull();
      expect(transformScheduleItem(undefined)).toBeNull();
      expect(transformScheduleItem(123)).toBeNull();
      expect(transformScheduleItem('string')).toBeNull();
      expect(transformScheduleItem([])).toBeNull();
      expect(transformScheduleItem({})).toBeNull();
    });

    it('handles edge cases with empty or malformed network/webChannel', () => {
      // Create items with empty or malformed network/webChannel
      const emptyNetworkItem = {
        id: 1001,
        show: {
          id: 1001,
          name: 'Empty Network Show',
          network: {}
        }
      };

      const malformedNetworkItem = {
        id: 1002,
        show: {
          id: 1002,
          name: 'Malformed Network Show',
          network: {
            name: 123 // Wrong type
          }
        }
      };

      const emptyWebChannelItem = {
        id: 2001,
        _embedded: {
          show: {
            id: 2001,
            name: 'Empty WebChannel Show',
            webChannel: {}
          }
        }
      };

      // Test transformations
      const emptyNetworkTransformed = transformScheduleItem(emptyNetworkItem);
      const malformedNetworkTransformed = transformScheduleItem(malformedNetworkItem);
      const emptyWebChannelTransformed = transformScheduleItem(emptyWebChannelItem);

      // Verify default network names are used
      expect(emptyNetworkTransformed?.network).toBe('Unknown Network');
      expect(malformedNetworkTransformed?.network).toBe('Unknown Network');
      expect(emptyWebChannelTransformed?.network).toBe('Unknown Network');
    });

    it('handles boundary cases for season and episode numbers', () => {
      // Test with extreme values
      const extremeValuesItem = {
        id: 3001,
        season: Number.MAX_SAFE_INTEGER.toString(),
        number: Number.MAX_SAFE_INTEGER.toString(),
        show: {
          id: 3001,
          name: 'Extreme Values Show'
        }
      };

      const negativeValuesItem = {
        id: 3002,
        season: '-1',
        number: '-5',
        show: {
          id: 3002,
          name: 'Negative Values Show'
        }
      };

      const nonNumericValuesItem = {
        id: 3003,
        season: 'abc',
        number: 'xyz',
        show: {
          id: 3003,
          name: 'Non-Numeric Values Show'
        }
      };

      // Test transformations
      const extremeValuesTransformed = transformScheduleItem(extremeValuesItem);
      const negativeValuesTransformed = transformScheduleItem(negativeValuesItem);
      const nonNumericValuesTransformed = transformScheduleItem(nonNumericValuesItem);

      // Verify number conversions
      expect(extremeValuesTransformed?.season).toBe(Number.MAX_SAFE_INTEGER);
      expect(extremeValuesTransformed?.number).toBe(Number.MAX_SAFE_INTEGER);
      
      expect(negativeValuesTransformed?.season).toBe(-1);
      expect(negativeValuesTransformed?.number).toBe(-5);
      
      expect(nonNumericValuesTransformed?.season).toBe(0);
      expect(nonNumericValuesTransformed?.number).toBe(0);
    });
  });
});
