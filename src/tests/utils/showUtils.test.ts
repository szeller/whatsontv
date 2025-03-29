/**
 * Tests for the ShowUtils utility functions
 */
import { jest, describe, it, expect } from '@jest/globals';

// Import the functions to test
import { 
  groupShowsByNetwork, 
  sortShowsByTime, 
  formatTime,
  filterByType,
  filterByNetwork,
  filterByGenre,
  filterByLanguage
} from '../../utils/showUtils.js';
import { getTodayDate } from '../../utils/dateUtils.js';
import type { Show } from '../../schemas/domain.js';

describe('ShowUtils', () => {
  describe('getTodayDate', () => {
    it('returns date in YYYY-MM-DD format', () => {
      // Mock Date to return a fixed date
      const mockDate = new Date(2025, 2, 20); // March 20, 2025
      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as unknown as DateConstructor;
      global.Date.UTC = originalDate.UTC;
      global.Date.parse = originalDate.parse;
      global.Date.now = originalDate.now;

      // Test the function
      const result = getTodayDate();
      
      // Restore original Date
      global.Date = originalDate;
      
      // Assert the result
      expect(result).toBe('2025-03-20');
    });
  });

  describe('groupShowsByNetwork', () => {
    it('groups shows by network name', () => {
      // Create test data
      const shows: Show[] = [
        createTestShow('Show 1', 'Drama', 'NBC'),
        createTestShow('Show 2', 'Comedy', 'NBC'),
        createTestShow('Show 3', 'Drama', 'ABC'),
        createTestShow('Show 4', 'Reality', 'CBS')
      ];
      
      // Call the function
      const result = groupShowsByNetwork(shows);
      
      // Assert the result
      expect(Object.keys(result).length).toBe(3);
      expect(result['NBC'].length).toBe(2);
      expect(result['ABC'].length).toBe(1);
      expect(result['CBS'].length).toBe(1);
      
      // Check that the shows are in the right groups
      expect(result['NBC'][0].name).toBe('Show 1');
      expect(result['NBC'][1].name).toBe('Show 2');
      expect(result['ABC'][0].name).toBe('Show 3');
      expect(result['CBS'][0].name).toBe('Show 4');
    });
    
    it('handles shows with null or empty network names', () => {
      // Create test data
      const shows: Show[] = [
        createTestShow('Show 1', 'Drama', 'NBC'),
        createTestShow('Show 2', 'Comedy', null),
        createTestShow('Show 3', 'Drama', '')
      ];
      
      // Call the function
      const result = groupShowsByNetwork(shows);
      
      // Assert the result
      expect(Object.keys(result).length).toBe(3);
      expect(result['NBC'].length).toBe(1);
      expect(result['Unknown Network'].length).toBe(1);
      
      // Check that the shows are in the right groups
      expect(result['NBC'][0].name).toBe('Show 1');
      expect(result['Unknown Network'][0].name).toBe('Show 2');
      // Empty string network is treated as its own group, not 'Unknown Network'
      expect(result[''].length).toBe(1);
      expect(result[''][0].name).toBe('Show 3');
    });
  });
  
  describe('sortShowsByTime', () => {
    it('sorts shows by airtime', () => {
      // Create test data
      const shows: Show[] = [
        createTestShowWithTime('Show 1', '21:00'),
        createTestShowWithTime('Show 2', '20:00'),
        createTestShowWithTime('Show 3', '22:00')
      ];
      
      // Call the function
      const result = sortShowsByTime(shows);
      
      // Assert the result
      expect(result[0].name).toBe('Show 2'); // 20:00
      expect(result[1].name).toBe('Show 1'); // 21:00
      expect(result[2].name).toBe('Show 3'); // 22:00
    });
    
    it('handles shows with null or empty airtimes', () => {
      // Create test data
      const shows: Show[] = [
        createTestShowWithTime('Show 1', null),
        createTestShowWithTime('Show 2', '20:00'),
        createTestShowWithTime('Show 3', '')
      ];
      
      // Call the function
      const result = sortShowsByTime(shows);
      
      // Assert the result
      expect(result[0].name).toBe('Show 2'); // Has airtime, should be first
      expect(result[1].name).toBe('Show 1'); // No airtime, sorted by name
      expect(result[2].name).toBe('Show 3'); // No airtime, sorted by name
    });
    
    it('sorts shows with same airtime by name', () => {
      // Create test data
      const shows: Show[] = [
        createTestShowWithTime('Show B', '20:00'),
        createTestShowWithTime('Show A', '20:00'),
        createTestShowWithTime('Show C', '20:00')
      ];
      
      // Call the function
      const result = sortShowsByTime(shows);
      
      // Assert the result - same time, so should be sorted by name
      expect(result[0].name).toBe('Show A');
      expect(result[1].name).toBe('Show B');
      expect(result[2].name).toBe('Show C');
    });

    it('sorts episodes of the same show by season and episode number', () => {
      // Create test data with same show but different episodes
      const shows: Show[] = [
        createTestShowWithEpisode('Same Show', '20:00', 2, 3),
        createTestShowWithEpisode('Same Show', '20:00', 1, 5),
        createTestShowWithEpisode('Same Show', '20:00', 2, 1)
      ];
      
      // Call the function
      const result = sortShowsByTime(shows);
      
      // Assert the result - same show and time, so should be sorted by season and episode
      expect(result[0].season).toBe(1); // Season 1 comes first
      expect(result[0].number).toBe(5);
      expect(result[1].season).toBe(2); // Then Season 2
      expect(result[1].number).toBe(1); // Episode 1 before Episode 3
      expect(result[2].season).toBe(2);
      expect(result[2].number).toBe(3);
    });

    it('sorts episodes without airtime by season and episode number', () => {
      // Create test data with same show but different episodes and no airtime
      const shows: Show[] = [
        createTestShowWithEpisode('Same Show', null, 3, 1),
        createTestShowWithEpisode('Same Show', null, 1, 2),
        createTestShowWithEpisode('Same Show', null, 2, 5)
      ];
      
      // Call the function
      const result = sortShowsByTime(shows);
      
      // Assert the result - no airtime, so should be sorted by season and episode
      expect(result[0].season).toBe(1);
      expect(result[0].number).toBe(2);
      expect(result[1].season).toBe(2);
      expect(result[1].number).toBe(5);
      expect(result[2].season).toBe(3);
      expect(result[2].number).toBe(1);
    });

    it('prioritizes shows with airtime over shows without airtime', () => {
      // Create test data with mix of shows with and without airtime
      const shows: Show[] = [
        createTestShowWithEpisode('Show A', null, 1, 1),
        createTestShowWithEpisode('Show B', '22:00', 1, 1),
        createTestShowWithEpisode('Show C', '20:00', 1, 1)
      ];
      
      // Call the function
      const result = sortShowsByTime(shows);
      
      // Shows with airtime should come first, sorted by time
      expect(result[0].name).toBe('Show C'); // 20:00
      expect(result[1].name).toBe('Show B'); // 22:00
      expect(result[2].name).toBe('Show A'); // null airtime
    });
  });
  
  describe('formatTime', () => {
    it('formats time string to 12-hour format', () => {
      expect(formatTime('08:00')).toBe('8:00 AM');
      expect(formatTime('12:00')).toBe('12:00 PM');
      expect(formatTime('15:30')).toBe('3:30 PM');
      expect(formatTime('00:00')).toBe('12:00 AM');
      expect(formatTime('23:59')).toBe('11:59 PM');
    });
    
    it('should handle invalid time strings', () => {
      expect(formatTime(null)).toBe('N/A');
      expect(formatTime('')).toBe('N/A');
      expect(formatTime('invalid')).toBe('N/A');
    });
  });
  
  describe('filterByType', () => {
    it('should filter shows by type', () => {
      // Create test data with different types
      const shows: Show[] = [
        createTestShow('Drama Show', 'Drama', 'NBC'),
        createTestShow('Comedy Show', 'Comedy', 'NBC'),
        createTestShow('Reality Show', 'Reality', 'ABC')
      ];
      
      // Test filtering by a single type
      let result = filterByType(shows, ['Drama']);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Drama Show');
      
      // Test filtering by multiple types
      result = filterByType(shows, ['Drama', 'Comedy']);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Drama Show');
      expect(result[1].name).toBe('Comedy Show');
      
      // Test with no matching types
      result = filterByType(shows, ['Documentary']);
      expect(result.length).toBe(0);
      
      // Test with empty types array
      result = filterByType(shows, []);
      expect(result.length).toBe(3);
    });
    
    it('should handle case insensitivity in type filtering', () => {
      const shows: Show[] = [
        createTestShow('Drama Show', 'Drama', 'NBC'),
        createTestShow('Comedy Show', 'Comedy', 'NBC')
      ];
      
      const result = filterByType(shows, ['drama', 'COMEDY']);
      expect(result.length).toBe(2);
    });
  });
  
  describe('filterByNetwork', () => {
    it('should filter shows by network', () => {
      // Create test data with different networks
      const shows: Show[] = [
        createTestShow('NBC Show 1', 'Drama', 'NBC'),
        createTestShow('NBC Show 2', 'Comedy', 'NBC'),
        createTestShow('ABC Show', 'Drama', 'ABC'),
        createTestShow('CBS Show', 'Reality', 'CBS')
      ];
      
      // Test filtering by a single network
      let result = filterByNetwork(shows, ['NBC']);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('NBC Show 1');
      expect(result[1].name).toBe('NBC Show 2');
      
      // Test filtering by multiple networks
      result = filterByNetwork(shows, ['NBC', 'ABC']);
      expect(result.length).toBe(3);
      
      // Test with no matching networks
      result = filterByNetwork(shows, ['HBO']);
      expect(result.length).toBe(0);
      
      // Test with empty networks array
      result = filterByNetwork(shows, []);
      expect(result.length).toBe(4);
    });
    
    it('should handle case insensitivity in network filtering', () => {
      const shows: Show[] = [
        createTestShow('NBC Show', 'Drama', 'NBC'),
        createTestShow('ABC Show', 'Comedy', 'ABC')
      ];
      
      const result = filterByNetwork(shows, ['nbc', 'abc']);
      expect(result.length).toBe(2);
    });
    
    it('should handle partial matches in network names', () => {
      const shows: Show[] = [
        createTestShow('HBO Show', 'Drama', 'HBO'),
        createTestShow('HBO Max Show', 'Comedy', 'HBO Max')
      ];
      
      const result = filterByNetwork(shows, ['HBO']);
      expect(result.length).toBe(2);
    });
  });
  
  describe('filterByGenre', () => {
    it('should filter shows by genre', () => {
      // Create test data with different genres
      const shows: Show[] = [
        createTestShowWithGenres('Drama Show', ['Drama']),
        createTestShowWithGenres('Comedy Show', ['Comedy']),
        createTestShowWithGenres('Mixed Show', ['Drama', 'Action'])
      ];
      
      // Test filtering by a single genre
      let result = filterByGenre(shows, ['Drama']);
      expect(result.length).toBe(2);
      
      // Test filtering by multiple genres
      result = filterByGenre(shows, ['Drama', 'Comedy']);
      expect(result.length).toBe(3);
      
      // Test with no matching genres
      result = filterByGenre(shows, ['Documentary']);
      expect(result.length).toBe(0);
      
      // Test with empty genres array
      result = filterByGenre(shows, []);
      expect(result.length).toBe(3);
    });
    
    it('should handle case insensitivity in genre filtering', () => {
      const shows: Show[] = [
        createTestShowWithGenres('Drama Show', ['Drama']),
        createTestShowWithGenres('Comedy Show', ['Comedy'])
      ];
      
      const result = filterByGenre(shows, ['drama', 'COMEDY']);
      expect(result.length).toBe(2);
    });
  });
  
  describe('filterByLanguage', () => {
    it('should filter shows by language', () => {
      // Create test data with different languages
      const shows: Show[] = [
        createTestShowWithLanguage('English Show', 'English'),
        createTestShowWithLanguage('Spanish Show', 'Spanish'),
        createTestShowWithLanguage('French Show', 'French')
      ];
      
      // Test filtering by a single language
      let result = filterByLanguage(shows, ['English']);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('English Show');
      
      // Test filtering by multiple languages
      result = filterByLanguage(shows, ['English', 'Spanish']);
      expect(result.length).toBe(2);
      
      // Test with no matching languages
      result = filterByLanguage(shows, ['German']);
      expect(result.length).toBe(0);
      
      // Test with empty languages array
      result = filterByLanguage(shows, []);
      expect(result.length).toBe(3);
    });
    
    it('should handle case insensitivity in language filtering', () => {
      const shows: Show[] = [
        createTestShowWithLanguage('English Show', 'English'),
        createTestShowWithLanguage('Spanish Show', 'Spanish')
      ];
      
      const result = filterByLanguage(shows, ['english', 'SPANISH']);
      expect(result.length).toBe(2);
    });
  });
});

// Helper functions for creating test data
function createTestShow(name: string, type: string, network: string | null): Show {
  return {
    id: Math.floor(Math.random() * 1000),
    name,
    type,
    language: 'English',
    genres: [],
    network: network === null ? 'Unknown Network' : network,
    summary: null,
    airtime: null,
    season: 1,
    number: 1
  };
}

function createTestShowWithTime(name: string, airtime: string | null): Show {
  return {
    id: Math.floor(Math.random() * 1000),
    name,
    type: 'Drama',
    language: 'English',
    genres: [],
    network: 'NBC',
    summary: null,
    airtime,
    season: 1,
    number: 1
  };
}

function createTestShowWithGenres(name: string, genres: string[]): Show {
  return {
    id: Math.floor(Math.random() * 1000),
    name,
    type: 'Drama',
    language: 'English',
    genres,
    network: 'NBC',
    summary: null,
    airtime: null,
    season: 1,
    number: 1
  };
}

function createTestShowWithLanguage(name: string, language: string): Show {
  return {
    id: Math.floor(Math.random() * 1000),
    name,
    type: 'Drama',
    language,
    genres: [],
    network: 'NBC',
    summary: null,
    airtime: null,
    season: 1,
    number: 1
  };
}

function createTestShowWithEpisode(
  name: string, 
  airtime: string | null, 
  season: number, 
  number: number
): Show {
  return {
    id: Math.floor(Math.random() * 1000),
    name,
    type: 'Drama',
    language: 'English',
    genres: [],
    network: 'NBC',
    summary: null,
    airtime,
    season,
    number
  };
}
