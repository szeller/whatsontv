/**
 * Tests for the Console Formatter Implementation
 */
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { container } from 'tsyringe';
import { ConsoleFormatterImpl } from '../../../implementations/console/consoleFormatterImpl.js';
import type { StyleService } from '../../../interfaces/styleService.js';
import type { Show } from '../../../schemas/domain.js';
import type { TvShowService } from '../../../interfaces/tvShowService.js';
import { ChalkStyleServiceImpl } from '../../../implementations/console/chalkStyleServiceImpl.js';
import { ShowBuilder, ShowFixtures } from '../../fixtures/helpers/showFixtureBuilder.js';
import { createMockTvShowService } from '../../testutils/testHelpers.js';

describe('ConsoleFormatterImpl', () => {
  let formatter: ConsoleFormatterImpl;
  let mockShow: Show;
  let mockShowNoAirtime: Show;
  let mockTvShowService: TvShowService;

  beforeEach(() => {
    // Reset container for each test
    container.clearInstances();
    
    // Create a mock TvShowService
    mockTvShowService = createMockTvShowService();
    container.registerInstance('TvShowService', mockTvShowService);
    
    // Register the style service
    container.registerInstance<StyleService>('StyleService', new ChalkStyleServiceImpl());

    // Create the formatter instance
    formatter = container.resolve(ConsoleFormatterImpl);
    
    // Create mock show data using ShowBuilder
    mockShow = ShowFixtures.createTestShow();
    
    // Create a mock show with no airtime
    mockShowNoAirtime = ShowFixtures.createTestShow({ airtime: null });
  });

  describe('formatShow', () => {
    it('should call formatTimedShow for shows with airtime', () => {
      const spy = jest.spyOn(formatter, 'formatTimedShow');
      formatter.formatShow(mockShow);
      expect(spy).toHaveBeenCalledWith(mockShow);
    });

    it('should call formatUntimedShow for shows without airtime', () => {
      const spy = jest.spyOn(formatter, 'formatUntimedShow');
      formatter.formatShow(mockShowNoAirtime);
      expect(spy).toHaveBeenCalledWith(mockShowNoAirtime);
    });
  });

  // Remove the .skip to enable these tests
  describe('formatTimedShow', () => {
    it('should format a show with airtime correctly', () => {
      const result = formatter.formatTimedShow(mockShow);
      expect(result).toContain('20:00');
      expect(result).toContain('Test Network');
      expect(result).toContain('Scripted');
      expect(result).toContain('Test Show');
      expect(result).toContain('S1E1');
    });

    it('should handle shows with missing information', () => {
      // Create a minimal show with only required fields
      const incompleteShow = ShowBuilder.createMinimalShow({
        id: 0,
        name: 'Unknown Show',
        airtime: '21:00',
        season: 2,
        number: 3
      });
        
      const result = formatter.formatTimedShow(incompleteShow);
      expect(result).toContain('21:00');
      expect(result).toContain('N/A');  // Empty network is replaced with 'N/A' in formatTimedShow
      expect(result).toContain('Unknown Show');
      expect(result).toContain('S2E3');
    });
  });

  describe('formatUntimedShow', () => {
    it('should format a show without airtime correctly', () => {
      const result = formatter.formatUntimedShow(mockShowNoAirtime);
      expect(result).toContain('N/A');
      expect(result).toContain('Test Network');
      expect(result).toContain('Scripted');
      expect(result).toContain('Test Show');
      expect(result).toContain('S1E1');
    });
  });

  describe('formatMultipleEpisodes', () => {
    it('should format multiple episodes of the same show correctly', () => {
      // Create multiple episodes of the same show using ShowBuilder
      const episodes = ShowBuilder.createEpisodeSequence(1, [1, 2]).map(episode => {
        return ShowFixtures.createTestShow({
          season: episode.season,
          number: episode.number
        });
      });
      
      const result = formatter.formatMultipleEpisodes(episodes);
      
      // Should have 1 line with comma-separated episodes
      expect(result.length).toBe(1);
      
      // Line should contain show info and all episodes
      expect(result[0]).toContain('N/A');
      expect(result[0]).toContain('Test Network');
      expect(result[0]).toContain('Scripted');
      expect(result[0]).toContain('Test Show');
      expect(result[0]).toContain('S1E1-2');
      
      // Should not contain the "Multiple Episodes" label
      expect(result[0]).not.toContain('Multiple Episodes');
    });

    it('should return empty array for empty array', () => {
      expect(formatter.formatMultipleEpisodes([])).toEqual([]);
    });
  });

  describe('formatNetworkGroups', () => {
    it('should format network groups correctly', () => {
      // Create network groups using ShowFixtures
      const testShow = ShowFixtures.createTestShow();
      const anotherShow = ShowFixtures.createTestShow({
        id: 2,
        name: 'Another Show',
        network: 'Another Network'
      });
      
      const networkGroups = {
        'Test Network': [testShow],
        'Another Network': [anotherShow]
      };
      
      const result = formatter.formatNetworkGroups(networkGroups);
      
      // Networks are sorted alphabetically, so "Another Network" comes first
      // This test case checks the length of the result array
      expect(result).toHaveLength(7); 
      
      // This test case checks the contents of the result array
      expect(result[0]).toContain('Another Network');
      expect(result[1]).toContain('---------------'); // Separator line
      expect(result[2]).toContain('Another Show');
      expect(result[3]).toBe(''); // Empty line between networks
      expect(result[4]).toContain('Test Network');
      expect(result[5]).toContain('------------'); // Separator line
      expect(result[6]).toContain('Test Show');
    });
    
    it('should apply custom sorting when timeSort is true', () => {
      const testShow = ShowFixtures.createTestShow();
      
      const networkGroups = {
        'Test Network': [testShow]
      };
      
      // Create a spy to observe the internal sorting logic
      const sortSpy = jest.spyOn(Array.prototype, 'sort');
      
      // Call the method with timeSort = true
      formatter.formatNetworkGroups(networkGroups, true);
      
      // Verify that some sort method was called
      expect(sortSpy).toHaveBeenCalled();
      
      // Clean up the spy
      sortSpy.mockRestore();
    });

    it('should handle empty networks', () => {
      const networkGroups = {
        'Empty Network': []
      };
      
      const result = formatter.formatNetworkGroups(networkGroups);
      
      // Should not include the empty network
      expect(result).toHaveLength(0);
    });

    it('should sort shows by airtime when timeSort is true', () => {
      // Create shows with specific airtimes using ShowBuilder
      const shows = ShowBuilder.withSpecificAirtimes(['22:00', '08:00']);
      shows[0].name = 'Late Show';
      shows[1].name = 'Early Show';
      shows[0].network = 'Test Network';
      shows[1].network = 'Test Network';
      
      const networkGroups = {
        'Test Network': shows
      };
      
      // Create a spy to observe the internal sorting logic
      const sortSpy = jest.spyOn(Array.prototype, 'sort');
      
      const result = formatter.formatNetworkGroups(networkGroups, true);
      
      // Verify that sort was called
      expect(sortSpy).toHaveBeenCalled();
      
      // Check that the result contains both shows
      expect(result.some(line => line.includes('Early Show'))).toBe(true);
      expect(result.some(line => line.includes('Late Show'))).toBe(true);
      
      // Clean up the spy
      sortSpy.mockRestore();
    });

    it('should handle shows with missing airtime when sorting', () => {
      // Create a show with airtime and one without
      const showWithoutAirtime = ShowFixtures.createTestShow({ 
        name: 'Show Without Airtime',
        airtime: null 
      });
      
      const showWithAirtime = ShowFixtures.createTestShow({ 
        name: 'Show With Airtime',
        airtime: '20:00' 
      });
      
      const networkGroups = {
        'Test Network': [showWithoutAirtime, showWithAirtime]
      };
      
      // Create a spy to observe the internal sorting logic
      const sortSpy = jest.spyOn(Array.prototype, 'sort');
      
      const result = formatter.formatNetworkGroups(networkGroups, true);
      
      // Verify that sort was called
      expect(sortSpy).toHaveBeenCalled();
      
      // Check that the result contains both shows
      expect(result.some(line => line.includes('Show With Airtime'))).toBe(true);
      expect(result.some(line => line.includes('Show Without Airtime'))).toBe(true);
      
      // Clean up the spy
      sortSpy.mockRestore();
    });

    it('should handle multiple episodes of the same show with different airtimes', () => {
      // Create multiple episodes of the same show with different airtimes
      const episodes = ShowBuilder.createEpisodeSequence(1, [1, 2]).map((episode, index) => {
        return ShowFixtures.createTestShow({
          season: episode.season,
          number: episode.number,
          airtime: index === 0 ? '20:00' : '21:00'
        });
      });
      
      const networkGroups = {
        'Test Network': episodes
      };
      
      const result = formatter.formatNetworkGroups(networkGroups);
      
      // Should format each episode separately
      expect(result.filter(line => line.includes('Test Show')).length).toBe(2);
    });
  });
});
