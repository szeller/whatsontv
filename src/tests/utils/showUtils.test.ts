/**
 * Tests for the ShowUtils utility functions
 */
import { jest, describe, it, expect } from '@jest/globals';

// Import the functions to test
import {
  groupShowsByNetwork,
  sortShowsByTime,
  filterByType,
  filterByNetwork,
  filterByGenre,
  filterByLanguage
} from '../../utils/showUtils.js';
import { getTodayDate } from '../../utils/dateUtils.js';
import { ShowBuilder, ShowFixtures } from '../fixtures/helpers/showFixtureBuilder.js';

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
      // Create test data using ShowFixtures
      const shows = ShowFixtures.withDifferentNetworks(['NBC', 'NBC', 'ABC', 'CBS']);
      
      // Update show names for better test clarity
      shows[0].name = 'Show 1';
      shows[1].name = 'Show 2';
      shows[2].name = 'Show 3';
      shows[3].name = 'Show 4';
      
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
      // Create test data using ShowBuilder
      const shows = [
        new ShowBuilder().withName('Show 1').withNetwork('NBC').build(),
        new ShowBuilder().withName('Show 2').withNetwork(null as unknown as string).build(),
        new ShowBuilder().withName('Show 3').withNetwork('').build()
      ];
      
      // Call the function
      const result = groupShowsByNetwork(shows);
      
      // Assert the result
      expect(Object.keys(result).length).toBe(2);
      expect(result['NBC'].length).toBe(1);
      // Both null and empty string are now 'Unknown Network'
      expect(result['Unknown Network'].length).toBe(2);
      
      // Check that the shows are in the right groups
      expect(result['NBC'][0].name).toBe('Show 1');
      
      // Both null and empty string networks are now in 'Unknown Network' group
      const unknownNetworkNames = result['Unknown Network'].map(show => show.name).sort();
      expect(unknownNetworkNames).toEqual(['Show 2', 'Show 3']);
    });
    
    it('removes country codes from network names when grouping', () => {
      // Create test data with country codes in network names
      const shows = [
        new ShowBuilder().withName('Show 1').withNetwork('Hulu (JP)').build(),
        new ShowBuilder().withName('Show 2').withNetwork('Hulu').build(),
        new ShowBuilder().withName('Show 3').withNetwork('Netflix (US)').build()
      ];
      
      // Call the function
      const result = groupShowsByNetwork(shows);
      
      // Assert the result - country codes should be removed, so we expect 2 groups
      expect(Object.keys(result).length).toBe(2);
      expect(result['Hulu'].length).toBe(2); // Both Hulu and Hulu (JP) should be in this group
      expect(result['Netflix'].length).toBe(1);
      
      // Check that the shows are in the right groups
      const huluShows = result['Hulu'].map(show => show.name).sort();
      expect(huluShows).toEqual(['Show 1', 'Show 2']);
      expect(result['Netflix'][0].name).toBe('Show 3');
    });
  });
  
  describe('sortShowsByTime', () => {
    it('sorts shows by airtime', () => {
      // Create test data using ShowBuilder.withSpecificAirtimes
      const shows = ShowBuilder.withSpecificAirtimes(['21:00', '20:00', '22:00']);
      shows[0].name = 'Show 1'; // 21:00
      shows[1].name = 'Show 2'; // 20:00
      shows[2].name = 'Show 3'; // 22:00
      
      // Call the function
      const result = sortShowsByTime(shows);
      
      // Assert the result
      expect(result[0].name).toBe('Show 2'); // 20:00
      expect(result[1].name).toBe('Show 1'); // 21:00
      expect(result[2].name).toBe('Show 3'); // 22:00
    });
    
    it('handles shows with null or empty airtimes', () => {
      // Create test data using ShowBuilder.withSpecificAirtimes
      const shows = ShowBuilder.withSpecificAirtimes(['21:00', null, '20:00']);
      shows[0].name = 'Show 1'; // 21:00
      shows[1].name = 'Show 2'; // null
      shows[2].name = 'Show 3'; // 20:00
      
      // Call the function
      const result = sortShowsByTime(shows);
      
      // Assert the result - null airtimes should be at the end
      expect(result[0].name).toBe('Show 3'); // 20:00
      expect(result[1].name).toBe('Show 1'); // 21:00
      expect(result[2].name).toBe('Show 2'); // null
    });
    
    it('sorts shows with the same airtime by name', () => {
      // Create test data using ShowBuilder
      const shows = ShowBuilder.withDifferentNames(['C Show', 'A Show', 'B Show']);
      
      // Set the same airtime for all shows
      shows.forEach(show => {
        show.airtime = '20:00';
      });
      
      // Call the function
      const result = sortShowsByTime(shows);
      
      // Assert the result - shows with the same airtime should be sorted by name
      expect(result[0].name).toBe('A Show');
      expect(result[1].name).toBe('B Show');
      expect(result[2].name).toBe('C Show');
    });
  });
  
  describe('filterByType', () => {
    it('should filter shows by type', () => {
      // Create test data with different types using ShowFixtures
      const shows = ShowFixtures.withDifferentTypes(['Drama', 'Comedy', 'Reality', 'Talk Show']);
      
      // Test filtering by a single type
      const dramaShows = filterByType(shows, ['Drama']);
      expect(dramaShows.length).toBe(1);
      expect(dramaShows[0].type).toBe('Drama');
      
      // Test filtering by multiple types
      const comedyAndRealityShows = filterByType(shows, ['Comedy', 'Reality']);
      expect(comedyAndRealityShows.length).toBe(2);
      expect(comedyAndRealityShows.map(show => show.type)).toContain('Comedy');
      expect(comedyAndRealityShows.map(show => show.type)).toContain('Reality');
      
      // Test with empty filter (should return all shows)
      const allShows = filterByType(shows, []);
      expect(allShows.length).toBe(shows.length);
    });
  });
  
  describe('filterByNetwork', () => {
    it('should filter shows by network', () => {
      // Create test data with different networks using ShowFixtures
      const shows = ShowFixtures.withDifferentNetworks(['ABC', 'NBC', 'CBS', 'FOX']);
      
      // Test filtering by a single network
      const abcShows = filterByNetwork(shows, ['ABC']);
      expect(abcShows.length).toBe(1);
      expect(abcShows[0].network).toBe('ABC');
      
      // Test filtering by multiple networks
      const abcAndNbcShows = filterByNetwork(shows, ['ABC', 'NBC']);
      expect(abcAndNbcShows.length).toBe(2);
      expect(abcAndNbcShows.map(show => show.network)).toContain('ABC');
      expect(abcAndNbcShows.map(show => show.network)).toContain('NBC');
      
      // Test with empty filter (should return all shows)
      const allShows = filterByNetwork(shows, []);
      expect(allShows.length).toBe(shows.length);
    });
  });
  
  describe('filterByGenre', () => {
    it('should filter shows by genre', () => {
      // Create test data with different genres using ShowFixtures
      const shows = ShowFixtures.withDifferentGenres([
        ['Drama'], 
        ['Comedy'], 
        ['Drama', 'Action'], 
        ['Comedy', 'Romance']
      ]);
      
      // Test filtering by a single genre
      const dramaShows = filterByGenre(shows, ['Drama']);
      expect(dramaShows.length).toBe(2);
      expect(dramaShows[0].genres).toContain('Drama');
      expect(dramaShows[1].genres).toContain('Drama');
      
      // Test filtering by multiple genres (shows that have ANY of the genres)
      const comedyOrActionShows = filterByGenre(shows, ['Comedy', 'Action']);
      expect(comedyOrActionShows.length).toBe(3);
      
      // Test with empty filter (should return all shows)
      const allShows = filterByGenre(shows, []);
      expect(allShows.length).toBe(shows.length);
    });
  });
  
  describe('filterByLanguage', () => {
    it('should filter shows by language', () => {
      // Create test data with different languages using ShowFixtures
      const shows = ShowFixtures.withDifferentLanguages([
        'English', 'Spanish', 'French', 'English'
      ]);
      
      // Test filtering by a single language
      const englishShows = filterByLanguage(shows, ['English']);
      expect(englishShows.length).toBe(2);
      
      // Test filtering by multiple languages
      const englishAndSpanishShows = filterByLanguage(shows, ['English', 'Spanish']);
      expect(englishAndSpanishShows.length).toBe(3);
      
      // Test with empty filter (should return all shows)
      const allShows = filterByLanguage(shows, []);
      expect(allShows.length).toBe(shows.length);
    });
    
    it('should handle null language values', () => {
      // Create test data with null language using ShowFixtures
      const shows = ShowFixtures.withDifferentLanguages(['English', null]);
      
      // Filter for English shows
      const englishShows = filterByLanguage(shows, ['English']);
      expect(englishShows.length).toBe(1);
      
      // Filter for null language (should not match anything)
      const nullLanguageShows = filterByLanguage(shows, ['null']);
      expect(nullLanguageShows.length).toBe(0);
    });
  });
});
