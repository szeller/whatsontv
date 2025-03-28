/**
 * Tests for the TVMaze domain model
 */
import { describe, it, expect } from '@jest/globals';

import {
  NetworkScheduleItem,
  WebScheduleItem,
  networkScheduleItemSchema,
  webScheduleItemSchema,
  networkSchema
} from '../../types/tvMazeModel.js';
import { Fixtures } from '../fixtures/index.js';

// Type definition for the show property to help TypeScript
interface ShowWithId {
  id: number;
  name: string;
}

describe('TVMaze Model', () => {
  // Load test fixtures using the utility class and add type assertions
  const networkSchedule = Fixtures.tvMaze.getSchedule('network-schedule') as 
    Array<NetworkScheduleItem & { show: ShowWithId }>;
  const webSchedule = Fixtures.tvMaze.getSchedule('web-schedule') as 
    Array<WebScheduleItem & { _embedded: { show: ShowWithId } }>;
  
  describe('Network Schema', () => {
    it('should validate a valid network', () => {
      // Arrange
      const validNetwork = {
        id: 1,
        name: 'Test Network',
        country: {
          name: 'United States',
          code: 'US',
          timezone: 'America/New_York'
        }
      };
      
      // Act
      const result = networkSchema.safeParse(validNetwork);
      
      // Assert
      expect(result.success).toBe(true);
    });
    
    it('should allow null country', () => {
      // Arrange
      const networkWithNullCountry = {
        id: 1,
        name: 'Test Network',
        country: null
      };
      
      // Act
      const result = networkSchema.safeParse(networkWithNullCountry);
      
      // Assert
      expect(result.success).toBe(true);
    });
  });
  
  describe('Network Schedule Item Schema', () => {
    it('should validate a valid network schedule item', () => {
      // Arrange
      const validItem = networkSchedule[0];
      
      // Act
      const result = networkScheduleItemSchema.safeParse(validItem);
      
      // Assert
      expect(result.success).toBe(true);
    });
    
    it('should handle numeric season and episode', () => {
      // Arrange
      const itemWithNumericValues = {
        ...networkSchedule[0],
        season: 1,
        number: 2
      };
      
      // Act
      const result = networkScheduleItemSchema.safeParse(itemWithNumericValues);
      
      // Assert
      expect(result.success).toBe(true);
    });
    
    it('should handle string season and episode', () => {
      // Arrange
      const itemWithStringValues = {
        ...networkSchedule[0],
        season: '1',
        number: '2'
      };
      
      // Act
      const result = networkScheduleItemSchema.safeParse(itemWithStringValues);
      
      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.season).toBe('number');
        expect(typeof result.data.number).toBe('number');
      }
    });
  });
  
  describe('Web Schedule Item Schema', () => {
    it('should validate a valid web schedule item', () => {
      // Arrange
      const validItem = webSchedule[0];
      
      // Act
      const result = webScheduleItemSchema.safeParse(validItem);
      
      // Assert
      expect(result.success).toBe(true);
    });
    
    it('should require _embedded.show property', () => {
      // Arrange
      const invalidItem = {
        ...webSchedule[0],
        _embedded: {}
      };
      
      // Act
      const result = webScheduleItemSchema.safeParse(invalidItem);
      
      // Assert
      expect(result.success).toBe(false);
    });
  });
});
