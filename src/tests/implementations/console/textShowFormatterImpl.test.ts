/**
 * Tests for the Text Show Formatter Implementation
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { container } from 'tsyringe';
import { TextShowFormatterImpl } from '../../../implementations/console/textShowFormatterImpl.js';
import type { StyleService } from '../../../interfaces/styleService.js';
import type { Show } from '../../../schemas/domain.js';
import type { TvShowService } from '../../../interfaces/tvShowService.js';
import type { ConfigService } from '../../../interfaces/configService.js';
import { PlainStyleServiceImpl } from '../../../implementations/test/plainStyleServiceImpl.js';
import { ShowBuilder, ShowFixtures } from '../../fixtures/helpers/showFixtureBuilder.js';
import { createMockTvShowService } from '../../mocks/factories/tvShowServiceFactory.js';
import { createMockConfigService } from '../../mocks/factories/configServiceFactory.js';

describe('TextShowFormatterImpl', () => {
  let formatter: TextShowFormatterImpl;
  let mockShow: Show;
  let mockShowNoAirtime: Show;
  let mockTvShowService: TvShowService;
  let mockConfigService: ConfigService;

  beforeEach(() => {
    // Reset container for each test
    container.clearInstances();
    
    // Create a mock TvShowService
    mockTvShowService = createMockTvShowService();
    container.registerInstance('TvShowService', mockTvShowService);
    
    // Create a mock ConfigService
    mockConfigService = createMockConfigService();
    container.registerInstance('ConfigService', mockConfigService);
    
    // Register the style service - use PlainStyleServiceImpl for tests to avoid ANSI color codes
    container.registerInstance<StyleService>('StyleService', new PlainStyleServiceImpl());

    // Create the formatter instance
    formatter = container.resolve(TextShowFormatterImpl);
    
    // Create mock show data using ShowBuilder
    mockShow = ShowFixtures.createTestShow();
    
    // Create a mock show with no airtime
    mockShowNoAirtime = ShowFixtures.createTestShow({ airtime: null });
  });

  describe('formatTimedShow', () => {
    it('should format a show with airtime correctly', () => {
      const result = formatter.formatTimedShow(mockShow);
      expect(result).toContain('20:00');
      expect(result).toContain('Test Network');
      expect(result).toContain('Scripted');
      expect(result).toContain('Test Show');
      expect(result).toContain('S01E01');
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
      // After refactoring, the N/A is shown in parentheses with the network
      expect(result).toContain('(,');  // Network is empty, not N/A in the new implementation
      expect(result).toContain('Unknown Show');
      expect(result).toContain('S02E03');
    });
  });

  describe('formatUntimedShow', () => {
    it('should format a show without airtime correctly', () => {
      const result = formatter.formatUntimedShow(mockShowNoAirtime);
      expect(result).toContain('Test Network');
      expect(result).toContain('Scripted');
      expect(result).toContain('Test Show');
      expect(result).toContain('S01E01');
    });
  });

  describe('formatMultipleEpisodes', () => {
    it('should format multiple episodes of the same show correctly', () => {
      // Create multiple episodes of the same show using ShowBuilder
      const episodes = ShowBuilder.createEpisodeSequence(1, [1, 2, 3]).map(episode => {
        return ShowFixtures.createTestShow({
          season: episode.season,
          number: episode.number
        });
      });
      
      const result = formatter.formatMultipleEpisodes(episodes);
      
      // Should return a single formatted string with episode range
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('Test Show');
      expect(result[0]).toContain('S01E01-03');
      expect(result[0]).toContain('Test Network');
    });
    
    it('should handle episodes with different seasons correctly', () => {
      // Create episodes from different seasons
      const episodes = [
        ShowFixtures.createTestShow({ season: 1, number: 10 }),
        ShowFixtures.createTestShow({ season: 2, number: 1 })
      ];
      
      const result = formatter.formatMultipleEpisodes(episodes);
      
      // Should format as range using full episode codes: S01E10-S02E01
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('S01E10-S02E01');
    });
    
    it('should handle episodes with missing season/number correctly', () => {
      // Create episodes with missing season/number
      const episodes = [
        ShowFixtures.createTestShow({ season: undefined, number: undefined }),
        ShowFixtures.createTestShow({ season: undefined, number: undefined })
      ];
      
      const result = formatter.formatMultipleEpisodes(episodes);
      
      // Should still return a result but without episode codes
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('Test Show');
    });

    it('should handle empty, null, or undefined input', () => {
      expect(formatter.formatMultipleEpisodes([])).toEqual([]);
      expect(formatter.formatMultipleEpisodes(null as unknown as Show[])).toEqual([]);
      expect(formatter.formatMultipleEpisodes(undefined as unknown as Show[])).toEqual([]);
    });
  });

  describe('formatNetwork', () => {
    it('should format a network and its shows correctly', () => {
      const shows = [mockShow, mockShowNoAirtime];
      const result = formatter.formatNetwork('Test Network', shows);
      
      // Should include network header and formatted shows
      expect(result.length).toBeGreaterThan(2);
      expect(result[0]).toContain('Test Network');
      
      // Should include both shows
      expect(result.some(line => line.includes('Test Show') && line.includes('20:00'))).toBe(true);
      expect(result.some(line => line.includes('Test Show') && line.includes('N/A'))).toBe(true);
    });
    
    it('should return header for empty shows array', () => {
      // The base class implementation now returns a header for empty networks
      const result = formatter.formatNetwork('Test Network', []);
      expect(result).toHaveLength(2); // Header + separator line
      expect(result[0]).toContain('Test Network');
    });
    
    it('should return header for null or undefined shows', () => {
      // The base class implementation now returns a header for empty networks
      expect(
        formatter.formatNetwork('Test Network', null as unknown as Show[])
      ).toHaveLength(2);
      expect(
        formatter.formatNetwork(
          'Test Network', 
          undefined as unknown as Show[]
        )
      ).toHaveLength(2);
    });
  });

  describe('formatNetworkGroups', () => {
    it('should format network groups correctly', () => {
      // Create network groups using ShowFixtures
      const testShow = ShowFixtures.createTestShow();
      const anotherShow = ShowFixtures.createTestShow({ name: 'Another Show' });
      
      const networkGroups = {
        'Test Network': [testShow],
        'Another Network': [anotherShow]
      };
      
      const result = formatter.formatNetworkGroups(networkGroups);
      
      // Should include both networks and their shows
      // Network 1: header + separator + show = 3 lines
      // Blank line = 1 line
      // Network 2: header + separator + show = 3 lines
      expect(result.length).toBe(7); 
      expect(result.some(line => line.includes('Test Network'))).toBe(true);
      expect(result.some(line => line.includes('Another Network'))).toBe(true);
      expect(result.some(line => line.includes('Test Show'))).toBe(true);
      expect(result.some(line => line.includes('Another Show'))).toBe(true);
    });
    
    it('should handle empty networks', () => {
      const networkGroups = {
        'Empty Network': []
      };
      
      const result = formatter.formatNetworkGroups(networkGroups);
      
      // Should not include the empty network with our new implementation
      expect(result).toHaveLength(0);
    });

    it('should handle null or undefined network groups', () => {
      expect(formatter.formatNetworkGroups(null as unknown as Record<string, Show[]>))
        .toEqual([]);
      expect(
        formatter.formatNetworkGroups(undefined as unknown as Record<string, Show[]>)
      ).toEqual([]);
    });

    it('should handle null or undefined shows in a network', () => {
      // Create a network groups object with valid and invalid entries
      const validShow = mockShow;
      const networkGroups = {
        'Valid Network': [validShow],
        'Invalid Network 1': null as unknown as Show[],
        'Invalid Network 2': undefined as unknown as Show[]
      };
      
      const result = formatter.formatNetworkGroups(networkGroups);
      
      // Should only include the valid network
      expect(result.length).toBe(3); // header + separator + show
      expect(result.some(line => line.includes('Valid Network'))).toBe(true);
      expect(result.some(line => line.includes('Test Show'))).toBe(true);
    });

    it('should sort shows by airtime', () => {
      // Create shows with specific airtimes using ShowBuilder
      const shows = ShowBuilder.withSpecificAirtimes(['22:00', '08:00']);
      shows[0].name = 'Late Show';
      shows[1].name = 'Early Show';
      
      const networkGroups = {
        'Test Network': shows
      };
      
      const result = formatter.formatNetworkGroups(networkGroups);
      
      // Early show should come before late show in the output
      const earlyShowIndex = result.findIndex(line => line.includes('Early Show'));
      const lateShowIndex = result.findIndex(line => line.includes('Late Show'));
      
      expect(earlyShowIndex).toBeLessThan(lateShowIndex);
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
      
      const result = formatter.formatNetworkGroups(networkGroups);
      
      // Show with airtime should come before show without airtime
      const withAirtimeIndex = result.findIndex(line => line.includes('Show With Airtime'));
      const withoutAirtimeIndex = result.findIndex(line => line.includes('Show Without Airtime'));
      
      expect(withAirtimeIndex).toBeLessThan(withoutAirtimeIndex);
    });
  });
});
