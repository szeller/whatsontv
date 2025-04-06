/**
 * Tests for the FormatterFactory
 */
import { describe, it, expect, jest } from '@jest/globals';
import { createMockFormatter } from './formatterFactory.js';
import type { NetworkGroups, Show } from '../../../schemas/domain.js';

describe('FormatterFactory', () => {
  describe('createMockFormatter', () => {
    // Sample test data
    const sampleShow: Show = {
      id: 1,
      name: 'Test Show',
      type: 'scripted',
      language: 'English',
      genres: ['Drama'],
      network: 'Test Network',
      summary: '<p>Test summary</p>',
      airtime: '20:00',
      season: 1,
      number: 1
    };

    const sampleNetworkGroups: NetworkGroups = {
      'Test Network': [sampleShow],
      'Another Network': [{ ...sampleShow, id: 2, name: 'Another Show' } as Show]
    };

    it('should create a mock formatter with default implementations', () => {
      // Act
      const formatter = createMockFormatter();

      // Assert
      expect(formatter).toBeDefined();
      expect(typeof formatter.formatTimedShow).toBe('function');
      expect(typeof formatter.formatUntimedShow).toBe('function');
      expect(typeof formatter.formatMultipleEpisodes).toBe('function');
      expect(typeof formatter.formatNetwork).toBe('function');
      expect(typeof formatter.formatNetworkGroups).toBe('function');

      // Check default implementations
      expect(formatter.formatTimedShow(sampleShow)).toBe('Timed Show: Test Show at 20:00');
      expect(formatter.formatUntimedShow(sampleShow)).toBe('Untimed Show: Test Show');
      const multipleResult = formatter.formatMultipleEpisodes([sampleShow]);
      expect(multipleResult).toEqual(['Multiple Episodes: Test Show']);
      
      // Check network formatting
      const networkResult = formatter.formatNetwork('Test Network', [sampleShow]);
      expect(networkResult).toHaveLength(2);
      expect(networkResult[0]).toBe('Network: Test Network');
      expect(networkResult[1]).toBe('  Show: Test Show');
      
      // Check network groups formatting
      const networkGroupsResult = formatter.formatNetworkGroups(sampleNetworkGroups);
      expect(networkGroupsResult.length).toBeGreaterThan(0);
      expect(networkGroupsResult[0]).toBe('Network: Test Network (1 shows)');
    });

    it('should use custom default formatted strings', () => {
      // Arrange
      const options = {
        defaultFormattedTimedShow: 'Custom Timed Format',
        defaultFormattedUntimedShow: 'Custom Untimed Format',
        defaultFormattedMultipleEpisodes: ['Custom Multiple Format'],
        defaultFormattedNetworkGroups: ['Custom Network Format']
      };

      // Act
      const formatter = createMockFormatter(options);

      // Assert
      expect(formatter.formatTimedShow(sampleShow)).toBe('Custom Timed Format');
      expect(formatter.formatUntimedShow(sampleShow)).toBe('Custom Untimed Format');
      expect(formatter.formatMultipleEpisodes([sampleShow])).toEqual(['Custom Multiple Format']);
      expect(formatter.formatNetworkGroups(sampleNetworkGroups)).toEqual(['Custom Network Format']);
    });

    it('should use show-specific formatters when provided', () => {
      // Arrange
      const options = {
        showFormatters: {
          1: 'Special Format for Show ID 1',
          2: 'Special Format for Show ID 2'
        }
      };

      // Act
      const formatter = createMockFormatter(options);

      // Assert
      expect(formatter.formatTimedShow(sampleShow)).toBe('Special Format for Show ID 1');
      const show2 = { ...sampleShow, id: 2 } as Show;
      expect(formatter.formatTimedShow(show2)).toBe('Special Format for Show ID 2');
      const show3 = { ...sampleShow, id: 3 } as Show;
      expect(formatter.formatTimedShow(show3)).toBe('Timed Show: Test Show at 20:00');
    });

    it('should apply custom implementation methods', () => {
      // Arrange
      const mockFormatTimedShow = jest.fn().mockReturnValue('Custom Implementation');

      // Act
      const formatter = createMockFormatter({
        implementation: {
          formatTimedShow: mockFormatTimedShow
        }
      });

      // Assert
      expect(formatter.formatTimedShow(sampleShow)).toBe('Custom Implementation');
      expect(mockFormatTimedShow).toHaveBeenCalledWith(sampleShow);
    });
  });
});
