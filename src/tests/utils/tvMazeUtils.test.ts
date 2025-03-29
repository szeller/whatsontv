/**
 * Tests for TVMaze utility functions
 */
import { describe, it, expect, jest } from '@jest/globals';
import { 
  getNetworkScheduleUrl, 
  getWebScheduleUrl,
  isWebScheduleItem,
  transformScheduleItem,
  transformSchedule
} from '../../utils/tvMazeUtils.js';
import { Fixtures } from '../fixtures/index.js';
import type { NetworkScheduleItem, WebScheduleItem } from '../../schemas/tvmaze.js';

// Type definition for the show property to help TypeScript
interface ShowWithId {
  id: number;
  name: string;
}

describe('TVMaze Utils', () => {
  // Load test fixtures using the utility class and add type assertions
  const networkSchedule = Fixtures.tvMaze.getSchedule('network-schedule') as 
    Array<NetworkScheduleItem & { show: ShowWithId }>;
  const webSchedule = Fixtures.tvMaze.getSchedule('web-schedule') as 
    Array<WebScheduleItem & { _embedded: { show: ShowWithId } }>;

  describe('URL Generation', () => {
    it('should generate network schedule URL with date and country', () => {
      const url = getNetworkScheduleUrl('2023-01-01', 'US');
      expect(url).toBe('https://api.tvmaze.com/schedule?date=2023-01-01&country=US');
    });
    
    it('should generate network schedule URL with date only', () => {
      const url = getNetworkScheduleUrl('2023-01-01');
      expect(url).toBe('https://api.tvmaze.com/schedule?date=2023-01-01');
    });
    
    it('should generate network schedule URL with no parameters', () => {
      const url = getNetworkScheduleUrl('');
      expect(url).toBe('https://api.tvmaze.com/schedule');
    });
    
    it('should generate web schedule URL with date', () => {
      const url = getWebScheduleUrl('2023-01-01');
      expect(url).toBe('https://api.tvmaze.com/schedule/web?date=2023-01-01');
    });
    
    it('should generate web schedule URL with no parameters', () => {
      const url = getWebScheduleUrl('');
      expect(url).toBe('https://api.tvmaze.com/schedule/web');
    });
  });
  
  describe('isWebScheduleItem', () => {
    it('should return true for valid web schedule items', () => {
      // Arrange
      const webItem = webSchedule[0];
      
      // Act & Assert
      expect(isWebScheduleItem(webItem)).toBe(true);
    });
    
    it('should return false for network schedule items', () => {
      // Arrange
      const networkItem = networkSchedule[0];
      
      // Act & Assert
      expect(isWebScheduleItem(networkItem)).toBe(false);
    });
    
    it('should handle invalid input gracefully', () => {
      // Arrange
      const invalidItems = [
        null,
        undefined,
        {},
        { _embedded: null },
        { _embedded: {} }
      ];
      
      // Act & Assert
      invalidItems.forEach(item => {
        expect(isWebScheduleItem(item)).toBe(false);
      });
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
        expect(result.id).toBe(networkItem.show.id);
        expect(result.name).toBe(networkItem.show.name);
        
        // Handle the network name with country code format
        const expectedNetwork = networkItem.show.network?.name ?? 'Unknown Network';
        // Check if network name is included in the result
        expect(result.network).toContain(expectedNetwork);
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
        expect(result.id).toBe(webItem._embedded.show.id);
        expect(result.name).toBe(webItem._embedded.show.name);
        // Web items use the webChannel name if available
        const webChannelName = webItem._embedded.show.webChannel?.name ?? '';
        if (webChannelName !== '') {
          expect(result.network).toBe(webChannelName);
        } else {
          expect(result.network).toBe('Unknown Network');
        }
      }
    });
    
    it('should handle null input gracefully', () => {
      // Act
      const result = transformScheduleItem(null);
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should handle undefined input gracefully', () => {
      // Act
      const result = transformScheduleItem(undefined);
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should handle non-object input gracefully', () => {
      // Act
      const result = transformScheduleItem('not an object');
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('transformSchedule Function', () => {
    it('should transform an array of schedule items', () => {
      // Arrange
      const mixedSchedule = [...networkSchedule, ...webSchedule];
      
      // Act
      const result = transformSchedule(mixedSchedule);
      
      // Assert
      expect(result).toHaveLength(mixedSchedule.length);
      expect(result[0]).not.toBeNull();
    });
    
    it('should filter out null results', () => {
      // Arrange
      const mixedSchedule = [...networkSchedule, null, ...webSchedule, undefined];
      
      // Act
      const result = transformSchedule(mixedSchedule as unknown[]);
      
      // Assert
      expect(result).toHaveLength(networkSchedule.length + webSchedule.length);
    });
    
    it('should return an empty array for null input', () => {
      // Act
      const result = transformSchedule(null as unknown as unknown[]);
      
      // Assert
      expect(result).toEqual([]);
    });
    
    it('should return an empty array for undefined input', () => {
      // Act
      const result = transformSchedule(undefined as unknown as unknown[]);
      
      // Assert
      expect(result).toEqual([]);
    });
  });
  
  describe('Error Handling', () => {
    it('handles errors in transformScheduleItem gracefully', () => {
      // Arrange
      const originalConsoleError = console.error;
      const consoleErrorMock = jest.fn();
      console.error = consoleErrorMock;
      
      try {
        // Create a malformed item that will cause an error during transformation
        const malformedItem = {
          show: {
            // This will cause an error when trying to access properties
            get network() {
              throw new Error('Test error');
            }
          }
        };
        
        // Set NODE_ENV to production to ensure console.error is called
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        
        // Act - this should not throw but return null
        const result = transformScheduleItem(malformedItem as unknown as NetworkScheduleItem);
        
        // Assert - the function returns null when an error occurs
        expect(result).toBeNull();
        expect(consoleErrorMock).toHaveBeenCalled();
        
        // Restore NODE_ENV
        process.env.NODE_ENV = originalNodeEnv;
      } finally {
        // Restore the original console.error
        console.error = originalConsoleError;
      }
    });
  });
});
