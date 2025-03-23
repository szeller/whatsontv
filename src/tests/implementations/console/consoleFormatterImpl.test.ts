import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { container, InjectionToken } from 'tsyringe';

import { ConsoleFormatterImpl } from '../../../implementations/console/consoleFormatterImpl';
import { createMockTvShowService } from '../../utils/testHelpers';
import type { Show } from '../../../types/tvmaze';
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
      airtime: '20:00',
      name: 'Test Episode',
      season: 1,
      number: 1,
      show: {
        id: 1,
        name: 'Test Show',
        type: 'Scripted',
        language: 'English',
        genres: ['Drama'],
        network: {
          id: 1,
          name: 'Test Network',
          country: {
            name: 'United States',
            code: 'US',
            timezone: 'America/New_York'
          }
        },
        webChannel: null,
        image: null,
        summary: 'Test summary'
      }
    };
    
    mockShowNoAirtime = {
      ...mockShow,
      airtime: ''
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
      expect(result).toContain('Test Episode');
    });

    it('should handle shows with missing information', () => {
      const incompleteShow: Show = {
        name: '',
        season: 2,
        number: 3,
        airtime: '21:00',
        show: {
          name: '',
          type: '',
          language: null,
          genres: [],
          network: null,
          webChannel: null,
          image: null,
          summary: ''
        }
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
      expect(result).toContain('Test Episode');
    });
  });

  describe('formatMultipleEpisodes', () => {
    it('should format multiple episodes of the same show correctly', () => {
      const episodes = [
        {
          ...mockShowNoAirtime,
          name: 'Episode 1',
          season: 1,
          number: 1
        },
        {
          ...mockShowNoAirtime,
          name: 'Episode 2',
          season: 1,
          number: 2
        }
      ];
      
      const result = formatter.formatMultipleEpisodes(episodes);
      const lines = result.split('\n');
      
      // Should have 3 lines: header + 2 episodes
      expect(lines.length).toBe(3);
      
      // Header should contain show info
      expect(lines[0]).toContain('TBA');
      expect(lines[0]).toContain('Test Network');
      expect(lines[0]).toContain('Scripted');
      expect(lines[0]).toContain('Test Show');
      expect(lines[0]).toContain('Multiple');
      
      // Episode lines should contain episode info
      expect(lines[1]).toContain('S1E1');
      expect(lines[1]).toContain('Episode 1');
      expect(lines[2]).toContain('S1E2');
      expect(lines[2]).toContain('Episode 2');
    });

    it('should return empty string for empty array', () => {
      expect(formatter.formatMultipleEpisodes([])).toBe('');
    });
  });

  describe('formatNetworkGroups', () => {
    it('should format network groups correctly', () => {
      const networkGroups = {
        'Test Network': [
          {
            ...mockShow,
            network: {
              id: 1,
              name: 'Test Network',
              country: {
                name: 'United States',
                code: 'US',
                timezone: 'America/New_York'
              }
            }
          }
        ],
        'Another Network': [
          {
            ...mockShow,
            network: {
              id: 2,
              name: 'Another Network',
              country: {
                name: 'United States',
                code: 'US',
                timezone: 'America/New_York'
              }
            }
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
  });
});
