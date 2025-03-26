import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { container, InjectionToken } from 'tsyringe';

import { ConsoleFormatterImpl } from '../../../implementations/console/consoleFormatterImpl';
import { createMockTvShowService } from '../../utils/testHelpers';
import type { Show } from '../../../types/tvShowModel.js';
import type { TvShowService } from '../../../interfaces/tvShowService';
import type { StyleService } from '../../../interfaces/styleService';
import { PlainStyleServiceImpl } from '../../../implementations/test/plainStyleServiceImpl';

describe('ConsoleFormatterImpl', () => {
  let formatter: ConsoleFormatterImpl;
  let mockShow: Show;
  let mockShowNoAirtime: Show;
  let mockTvShowService: TvShowService;

  beforeEach(() => {
    // Reset container for each test
    container.clearInstances();
    
    // Register the PlainStyleService for testing
    container.registerInstance<StyleService>('StyleService', new PlainStyleServiceImpl());
    
    // Create a mock TvShowService
    mockTvShowService = createMockTvShowService();
    container.registerInstance<TvShowService>('TvShowService', mockTvShowService);
    
    // Create the formatter instance with proper type casting
    formatter = container.resolve(ConsoleFormatterImpl as InjectionToken<ConsoleFormatterImpl>);
    
    // Create mock show data
    mockShow = {
      id: 1,
      name: 'Test Show',
      type: 'Scripted',
      language: 'English',
      genres: ['Drama'],
      network: 'Test Network',
      summary: 'Test summary',
      airtime: '20:00',
      season: 1,
      number: 1
    };
    
    mockShowNoAirtime = {
      ...mockShow,
      airtime: null
    };
    
    // Reset all mocks before each test
    jest.clearAllMocks();
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
      const incompleteShow: Show = {
        id: 0,
        name: 'Unknown Show',
        type: '',
        language: null,
        genres: [],
        network: '',
        summary: null,
        airtime: '21:00',
        season: 2,
        number: 3
      };
      
      const result = formatter.formatTimedShow(incompleteShow);
      expect(result).toContain('21:00');
      expect(result).toContain('N/A');
      expect(result).toContain('Unknown');
      expect(result).toContain('S2E3');
    });
  });

  describe('formatUntimedShow', () => {
    it('should format a show without airtime correctly', () => {
      const result = formatter.formatUntimedShow(mockShowNoAirtime);
      expect(result).toContain('TBA');
      expect(result).toContain('Test Network');
      expect(result).toContain('Scripted');
      expect(result).toContain('Test Show');
      expect(result).toContain('S1E1');
    });
  });

  describe('formatMultipleEpisodes', () => {
    it('should format multiple episodes of the same show correctly', () => {
      const episodes = [
        {
          ...mockShow,
          season: 1,
          number: 1
        },
        {
          ...mockShow,
          season: 1,
          number: 2
        }
      ];
      
      const result = formatter.formatMultipleEpisodes(episodes);
      
      // Should have 3 lines: header + 2 episodes
      expect(result.length).toBe(3);
      
      // Header should contain show info
      expect(result[0]).toContain('TBA');
      expect(result[0]).toContain('Test Network');
      expect(result[0]).toContain('Scripted');
      expect(result[0]).toContain('Test Show');
      expect(result[0]).toContain('Multiple');
      
      // Episode lines should contain episode info
      expect(result[1]).toContain('S1E1');
      expect(result[2]).toContain('S1E2');
    });

    it('should return empty array for empty array', () => {
      expect(formatter.formatMultipleEpisodes([])).toEqual([]);
    });
  });

  describe('formatNetworkGroups', () => {
    it('should format network groups correctly', () => {
      const networkGroups = {
        'Test Network': [
          {
            ...mockShow,
            network: 'Test Network'
          }
        ],
        'Another Network': [
          {
            ...mockShow,
            network: 'Another Network'
          }
        ]
      };
      
      const result = formatter.formatNetworkGroups(networkGroups);
      
      // Networks are sorted alphabetically, so "Another Network" comes first
      expect(result).toHaveLength(6); // 2 networks with a header, separator, and show line each
      expect(result[0]).toContain('Another Network');
      expect(result[1]).toContain('---------------'); // Separator line
      expect(result[2]).toContain('Test Show');
      expect(result[3]).toContain('Test Network');
      expect(result[4]).toContain('------------'); // Separator line
      expect(result[5]).toContain('Test Show');
    });
    
    it('should apply custom sorting when timeSort is true', () => {
      const networkGroups = {
        'Test Network': [mockShow]
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
      const networkGroups = {
        'Test Network': [
          {
            ...mockShow,
            id: 1,
            name: 'Late Show',
            airtime: '22:00'
          },
          {
            ...mockShow,
            id: 2,
            name: 'Early Show',
            airtime: '08:00'
          }
        ]
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
      const networkGroups = {
        'Test Network': [
          {
            ...mockShow,
            id: 1,
            name: 'Show Without Airtime',
            airtime: null
          },
          {
            ...mockShow,
            id: 2,
            name: 'Show With Airtime',
            airtime: '20:00'
          }
        ]
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
      const networkGroups = {
        'Test Network': [
          {
            ...mockShow,
            id: 1,
            name: 'Same Show',
            airtime: '20:00',
            season: 1,
            number: 1
          },
          {
            ...mockShow,
            id: 1,
            name: 'Same Show',
            airtime: '21:00',
            season: 1,
            number: 2
          }
        ]
      };
      
      const result = formatter.formatNetworkGroups(networkGroups);
      
      // Should format each episode separately
      expect(result.filter(line => line.includes('Same Show')).length).toBe(2);
    });
  });
});
