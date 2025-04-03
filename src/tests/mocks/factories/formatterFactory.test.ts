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
      expect(typeof formatter.formatShow).toBe('function');
      expect(typeof formatter.formatTimedShow).toBe('function');
      expect(typeof formatter.formatUntimedShow).toBe('function');
      expect(typeof formatter.formatMultipleEpisodes).toBe('function');
      expect(typeof formatter.formatNetworkGroups).toBe('function');

      // Check default implementations
      expect(formatter.formatShow(sampleShow)).toBe('Show: Test Show');
      expect(formatter.formatTimedShow(sampleShow)).toBe('Timed Show: Test Show at 20:00');
      expect(formatter.formatUntimedShow(sampleShow)).toBe('Untimed Show: Test Show');
      const multipleResult = formatter.formatMultipleEpisodes([sampleShow]);
      expect(multipleResult).toEqual(['Multiple Episodes: Test Show']);
      
      // Check network groups formatting
      const networkGroupsResult = formatter.formatNetworkGroups(sampleNetworkGroups);
      expect(networkGroupsResult).toHaveLength(2);
      expect(networkGroupsResult[0]).toBe('Network: Test Network (1 shows)');
      expect(networkGroupsResult[1]).toBe('Network: Another Network (1 shows)');
    });

    it('should use custom default formatted strings', () => {
      // Arrange
      const options = {
        defaultFormattedShow: 'Custom Show Format',
        defaultFormattedTimedShow: 'Custom Timed Format',
        defaultFormattedUntimedShow: 'Custom Untimed Format',
        defaultFormattedMultipleEpisodes: ['Custom Multiple Format'],
        defaultFormattedNetworkGroups: ['Custom Network Format']
      };

      // Act
      const formatter = createMockFormatter(options);

      // Assert
      expect(formatter.formatShow(sampleShow)).toBe('Custom Show Format');
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
      expect(formatter.formatShow(sampleShow)).toBe('Special Format for Show ID 1');
      const show2 = { ...sampleShow, id: 2 } as Show;
      expect(formatter.formatShow(show2)).toBe('Special Format for Show ID 2');
      const show3 = { ...sampleShow, id: 3 } as Show;
      expect(formatter.formatShow(show3)).toBe('Show: Test Show');
    });

    it('should apply custom implementation methods', () => {
      // Arrange
      const mockFormatShow = jest.fn().mockReturnValue('Custom Implementation');

      // Act
      const formatter = createMockFormatter({
        implementation: {
          formatShow: mockFormatShow
        }
      });

      // Assert
      expect(formatter.formatShow(sampleShow)).toBe('Custom Implementation');
      expect(mockFormatShow).toHaveBeenCalledWith(sampleShow);
    });
  });
});
