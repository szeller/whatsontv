import 'reflect-metadata';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { container } from 'tsyringe';

import { ConsoleFormatter } from '../../formatters/consoleFormatter.js';
import { createMockTvShowService } from '../utils/testHelpers.js';
import type { Show } from '../../types/tvmaze.js';
import type { TvShowService } from '../../interfaces/tvShowService.js';
import { PlainStyleService } from '../../utils/styleService.js';

describe('ConsoleFormatter', () => {
  let formatter: ConsoleFormatter;
  let mockShow: Show;
  let mockShowNoAirtime: Show;
  let mockTvShowService: TvShowService;

  beforeEach(() => {
    // Reset container for each test
    container.clearInstances();
    
    // Register the PlainStyleService for testing
    container.register('StyleService', {
      useValue: new PlainStyleService()
    });
    
    // Create and register mock TvShowService
    mockTvShowService = createMockTvShowService();
    container.register('TvShowService', {
      useValue: mockTvShowService
    });
    
    // Create formatter with DI
    formatter = container.resolve(ConsoleFormatter);
    
    // Create a complete mock show with all required properties
    mockShow = {
      name: 'Test Episode',
      season: 1,
      number: 1,
      airtime: '20:00',
      show: {
        name: 'Test Show',
        type: 'Scripted',
        language: 'English',
        genres: ['Drama'],
        network: {
          id: 1,
          name: 'Test Network',
          country: null
        },
        webChannel: null,
        image: null,
        summary: 'Test summary'
      }
    };
    
    // Mock show without airtime (using empty string instead of null)
    mockShowNoAirtime = {
      ...mockShow,
      airtime: ''
    };
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
        'Test Network': [mockShow],
        'Another Network': [
          {
            ...mockShow,
            show: {
              ...mockShow.show,
              name: 'Another Show',
              network: {
                id: 2,
                name: 'Another Network',
                country: null
              }
            }
          }
        ]
      };
      
      const result = formatter.formatNetworkGroups(networkGroups);
      
      // Should have 4 elements: 2 networks with header + 1 show each
      expect(result.length).toBe(4);
      
      // Check that both network headers are present, but don't rely on specific order
      const networkHeaders = result.filter(line => line.startsWith('\n'));
      expect(networkHeaders).toHaveLength(2);
      expect(networkHeaders).toContain('\nTest Network:');
      expect(networkHeaders).toContain('\nAnother Network:');
    });

    it('should sort shows by time when timeSort is true', () => {
      // Create shows with different airtimes
      const earlyShow = {
        ...mockShow,
        airtime: '08:00'
      };
      
      const lateShow = {
        ...mockShow,
        airtime: '20:00'
      };
      
      const networkGroups = {
        'Test Network': [lateShow, earlyShow]
      };
      
      // Mock the tvShowService.sortShowsByTime method
      const sortSpy = jest.spyOn(mockTvShowService, 'sortShowsByTime');
      
      // Call the method with timeSort = true
      formatter.formatNetworkGroups(networkGroups, true);
      
      // Verify the sort method was called
      expect(sortSpy).toHaveBeenCalled();
    });
  });
});
