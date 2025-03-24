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
      
      expect(transformed).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        channel: expect.any(String),
        isStreaming: false,
        season: expect.any(Number),
        number: expect.any(Number)
      });
      
      // Validate against our schema
      const validation = showSchema.safeParse(transformed);
      expect(validation.success).toBe(true);
    });

    it('transforms web schedule items correctly', () => {
      const webItem = webSchedule[0];
      const transformed = transformScheduleItem(webItem);
      
      expect(transformed).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        channel: expect.any(String),
        isStreaming: true,
        season: expect.any(Number),
        number: expect.any(Number)
      });
      
      // Validate against our schema
      const validation = showSchema.safeParse(transformed);
      expect(validation.success).toBe(true);
    });

    it('transforms a mixed schedule correctly', () => {
      const transformed = transformSchedule(combinedSchedule);
      
      expect(transformed).toHaveLength(combinedSchedule.length);
      
      // Check that we have both streaming and network shows
      const streamingShows = transformed.filter(show => show.isStreaming);
      const networkShows = transformed.filter(show => !show.isStreaming);
      
      expect(streamingShows.length).toBeGreaterThan(0);
      expect(networkShows.length).toBeGreaterThan(0);
    });

    it('handles conversion of string numbers to numeric values', () => {
      const itemWithStringValues = {
        ...networkSchedule[0],
        season: '5',
        number: '10'
      };
      
      const transformed = transformScheduleItem(itemWithStringValues);
      
      expect(typeof transformed.season).toBe('number');
      expect(transformed.season).toBe(5);
      expect(typeof transformed.number).toBe('number');
      expect(transformed.number).toBe(10);
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
      expect(() => {
        const transformed = transformScheduleItem(incompleteItem);
        
        // Should return a valid show object with default values
        expect(transformed.id).toBe(123);
        expect(transformed.name).toBe('');
        expect(transformed.channel).toBe('Unknown Network');
        expect(transformed.season).toBe(0);
        expect(transformed.number).toBe(0);
      }).not.toThrow();
    });
  });
});
