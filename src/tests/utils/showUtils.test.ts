/**
 * Tests for the ShowUtils utility functions
 */
import { jest, describe, it, expect } from '@jest/globals';

// Import the functions to test
import { 
  getTodayDate, 
  groupShowsByNetwork, 
  sortShowsByTime, 
  normalizeShowData,
  formatTime,
  filterByType,
  filterByNetwork,
  filterByGenre,
  filterByLanguage
} from '../../utils/showUtils.js';
import type { Show } from '../../types/tvmaze.js';

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
        {
          name: 'Show 1',
          season: 1,
          number: 1,
          airtime: '20:00',
          show: {
            name: 'Show 1',
            type: 'Scripted',
            language: 'English',
            genres: ['Drama'],
            network: { id: 1, name: 'Network A', country: null },
            webChannel: null,
            image: null,
            summary: 'Test summary'
          }
        },
        {
          name: 'Show 2',
          season: 1,
          number: 1,
          airtime: '21:00',
          show: {
            name: 'Show 2',
            type: 'Scripted',
            language: 'English',
            genres: ['Comedy'],
            network: { id: 2, name: 'Network B', country: null },
            webChannel: null,
            image: null,
            summary: 'Test summary'
          }
        },
        {
          name: 'Show 3',
          season: 1,
          number: 1,
          airtime: '22:00',
          show: {
            name: 'Show 3',
            type: 'Scripted',
            language: 'English',
            genres: ['Action'],
            network: { id: 1, name: 'Network A', country: null },
            webChannel: null,
            image: null,
            summary: 'Test summary'
          }
        }
      ];

      // Test the function
      const result = groupShowsByNetwork(shows);
      
      // Assert the result
      expect(Object.keys(result)).toHaveLength(2);
      expect(result['Network A']).toHaveLength(2);
      expect(result['Network B']).toHaveLength(1);
      expect(result['Network A'][0].name).toBe('Show 1');
      expect(result['Network A'][1].name).toBe('Show 3');
      expect(result['Network B'][0].name).toBe('Show 2');
    });

    it('handles shows with web channel instead of network', () => {
      // Create test data
      const shows: Show[] = [
        {
          name: 'Web Show',
          season: 1,
          number: 1,
          airtime: '20:00',
          show: {
            name: 'Web Show',
            type: 'Scripted',
            language: 'English',
            genres: ['Drama'],
            network: null,
            webChannel: { id: 1, name: 'Netflix', country: null },
            image: null,
            summary: 'Test summary'
          }
        }
      ];

      // Test the function
      const result = groupShowsByNetwork(shows);
      
      // Assert the result
      expect(Object.keys(result)).toHaveLength(1);
      expect(result['Netflix']).toHaveLength(1);
      expect(result['Netflix'][0].name).toBe('Web Show');
    });

    it('groups shows with no network or web channel under "Unknown Network"', () => {
      // Create test data
      const shows: Show[] = [
        {
          name: 'Unknown Show',
          season: 1,
          number: 1,
          airtime: '20:00',
          show: {
            name: 'Unknown Show',
            type: 'Scripted',
            language: 'English',
            genres: ['Drama'],
            network: null,
            webChannel: null,
            image: null,
            summary: 'Test summary'
          }
        }
      ];

      // Test the function
      const result = groupShowsByNetwork(shows);
      
      // Assert the result
      expect(Object.keys(result)).toHaveLength(1);
      expect(result['Unknown Network']).toHaveLength(1);
      expect(result['Unknown Network'][0].name).toBe('Unknown Show');
    });
  });

  describe('sortShowsByTime', () => {
    it('sorts shows by airtime', () => {
      // Create test data
      const shows: Show[] = [
        {
          name: 'Late Show',
          season: 1,
          number: 1,
          airtime: '22:00',
          show: {
            name: 'Late Show',
            type: '',
            language: '',
            genres: [],
            network: null,
            webChannel: null,
            image: null,
            summary: ''
          }
        },
        {
          name: 'Early Show',
          season: 1,
          number: 1,
          airtime: '08:00',
          show: {
            name: 'Early Show',
            type: '',
            language: '',
            genres: [],
            network: null,
            webChannel: null,
            image: null,
            summary: ''
          }
        },
        {
          name: 'Mid Show',
          season: 1,
          number: 1,
          airtime: '12:00',
          show: {
            name: 'Mid Show',
            type: '',
            language: '',
            genres: [],
            network: null,
            webChannel: null,
            image: null,
            summary: ''
          }
        }
      ];

      // Test the function
      const result = sortShowsByTime(shows);
      
      // Assert the result
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Early Show');
      expect(result[1].name).toBe('Mid Show');
      expect(result[2].name).toBe('Late Show');
    });

    it('handles shows with missing airtime', () => {
      // Create test data
      const shows: Show[] = [
        {
          name: 'No Time Show',
          season: 1,
          number: 1,
          airtime: '',
          show: {
            name: 'No Time Show',
            type: '',
            language: '',
            genres: [],
            network: null,
            webChannel: null,
            image: null,
            summary: ''
          }
        },
        {
          name: 'Timed Show',
          season: 1,
          number: 1,
          airtime: '08:00',
          show: {
            name: 'Timed Show',
            type: '',
            language: '',
            genres: [],
            network: null,
            webChannel: null,
            image: null,
            summary: ''
          }
        }
      ];

      // Test the function
      const result = sortShowsByTime(shows);
      
      // Assert the result
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Timed Show');
      expect(result[1].name).toBe('No Time Show');
    });
  });

  // New tests for formatTime
  describe('formatTime', () => {
    it('should format time string to 12-hour format', () => {
      expect(formatTime('13:30')).toBe('1:30 PM');
      expect(formatTime('08:15')).toBe('8:15 AM');
      expect(formatTime('00:00')).toBe('12:00 AM');
      expect(formatTime('12:00')).toBe('12:00 PM');
    });
    
    it('should handle undefined time', () => {
      expect(formatTime(undefined)).toBe('TBA');
    });
    
    it('should handle invalid time format', () => {
      expect(formatTime('not-a-time')).toBe('TBA');
    });
  });

  // New tests for filterByType
  describe('filterByType', () => {
    it('should filter shows by type', () => {
      // Create test data
      const shows: Show[] = [
        createTestShow('Show 1', 'Scripted'),
        createTestShow('Show 2', 'Reality'),
        createTestShow('Show 3', 'Documentary')
      ];
      
      // Test filtering
      const filtered = filterByType(shows, ['Scripted', 'Documentary']);
      
      // Assert
      expect(filtered.length).toBe(2);
      expect(filtered[0].show.name).toBe('Show 1');
      expect(filtered[1].show.name).toBe('Show 3');
    });
    
    it('should return all shows when types array is empty', () => {
      // Create test data
      const shows: Show[] = [
        createTestShow('Show 1', 'Scripted'),
        createTestShow('Show 2', 'Reality')
      ];
      
      // Test filtering
      const filtered = filterByType(shows, []);
      
      // Assert
      expect(filtered.length).toBe(2);
    });
  });

  // New tests for filterByNetwork
  describe('filterByNetwork', () => {
    it('should filter shows by network', () => {
      // Create test data with different networks
      const shows: Show[] = [
        createTestShowWithNetwork('Show 1', 'HBO'),
        createTestShowWithNetwork('Show 2', 'Netflix'),
        createTestShowWithNetwork('Show 3', 'ABC')
      ];
      
      // Test filtering
      const filtered = filterByNetwork(shows, ['HBO', 'ABC']);
      
      // Assert
      expect(filtered.length).toBe(2);
      expect(filtered[0].show.name).toBe('Show 1');
      expect(filtered[1].show.name).toBe('Show 3');
    });
    
    it('should return all shows when networks array is empty', () => {
      // Create test data
      const shows: Show[] = [
        createTestShowWithNetwork('Show 1', 'HBO'),
        createTestShowWithNetwork('Show 2', 'Netflix')
      ];
      
      // Test filtering
      const filtered = filterByNetwork(shows, []);
      
      // Assert
      expect(filtered.length).toBe(2);
    });
  });

  // New tests for filterByGenre
  describe('filterByGenre', () => {
    it('should filter shows by genre', () => {
      // Create test data with different genres
      const shows: Show[] = [
        createTestShowWithGenres('Show 1', ['Drama', 'Thriller']),
        createTestShowWithGenres('Show 2', ['Comedy']),
        createTestShowWithGenres('Show 3', ['Drama', 'Fantasy'])
      ];
      
      // Test filtering
      const filtered = filterByGenre(shows, ['Drama']);
      
      // Assert
      expect(filtered.length).toBe(2);
      expect(filtered[0].show.name).toBe('Show 1');
      expect(filtered[1].show.name).toBe('Show 3');
    });
    
    it('should return all shows when genres array is empty', () => {
      // Create test data
      const shows: Show[] = [
        createTestShowWithGenres('Show 1', ['Drama']),
        createTestShowWithGenres('Show 2', ['Comedy'])
      ];
      
      // Test filtering
      const filtered = filterByGenre(shows, []);
      
      // Assert
      expect(filtered.length).toBe(2);
    });
  });

  // New tests for filterByLanguage
  describe('filterByLanguage', () => {
    it('should filter shows by language', () => {
      // Create test data with different languages
      const shows: Show[] = [
        createTestShowWithLanguage('Show 1', 'English'),
        createTestShowWithLanguage('Show 2', 'Spanish'),
        createTestShowWithLanguage('Show 3', 'English')
      ];
      
      // Test filtering
      const filtered = filterByLanguage(shows, ['English']);
      
      // Assert
      expect(filtered.length).toBe(2);
      expect(filtered[0].show.name).toBe('Show 1');
      expect(filtered[1].show.name).toBe('Show 3');
    });
    
    it('should return all shows when languages array is empty', () => {
      // Create test data
      const shows: Show[] = [
        createTestShowWithLanguage('Show 1', 'English'),
        createTestShowWithLanguage('Show 2', 'Spanish')
      ];
      
      // Test filtering
      const filtered = filterByLanguage(shows, []);
      
      // Assert
      expect(filtered.length).toBe(2);
    });
  });

  // New tests for normalizeShowData
  describe('normalizeShowData', () => {
    it('should normalize TVMaze show data to internal format', () => {
      // Create a raw TVMaze show
      const tvMazeShow = {
        id: 1,
        name: 'Test Show',
        type: 'Scripted',
        language: 'English',
        genres: ['Drama', 'Thriller'],
        airtime: '20:00',
        network: {
          id: 1,
          name: 'HBO',
          country: {
            name: 'United States',
            code: 'US',
            timezone: 'America/New_York'
          }
        },
        webChannel: null,
        image: {
          medium: 'http://example.com/image.jpg',
          original: 'http://example.com/image_large.jpg'
        },
        summary: '<p>Test summary</p>'
      };
      
      // Normalize the data
      const normalized = normalizeShowData(tvMazeShow);
      
      // Assert
      expect(normalized.show.id).toBe(1);
      expect(normalized.show.name).toBe('Test Show');
      expect(normalized.show.type).toBe('Scripted');
      expect(normalized.show.language).toBe('English');
      expect(normalized.show.genres).toEqual(['Drama', 'Thriller']);
      expect(normalized.show.network?.name).toBe('HBO');
      expect(normalized.show.summary).toBe('Test summary');
    });
    
    it('should handle missing or null properties', () => {
      // Create a minimal TVMaze show with missing properties
      const tvMazeShow = {
        id: 1,
        name: 'Test Show',
        airtime: '20:00'
      };
      
      // Normalize the data
      const normalized = normalizeShowData(tvMazeShow);
      
      // Assert
      expect(normalized.show.id).toBe(1);
      expect(normalized.show.name).toBe('Test Show');
      expect(normalized.show.genres).toEqual([]);
      expect(normalized.show.network).toBeNull();
      expect(normalized.show.webChannel).toBeNull();
      expect(normalized.show.image).toBeNull();
      expect(normalized.show.summary).toBe('');
    });
  });
});

// Helper functions for creating test data
function createTestShow(name: string, type: string): Show {
  return {
    name,
    season: 1,
    number: 1,
    airtime: '20:00',
    show: {
      id: Math.floor(Math.random() * 1000),
      name,
      type,
      language: 'English',
      genres: ['Drama'],
      network: { id: 1, name: 'Test Network', country: null },
      webChannel: null,
      image: null,
      summary: 'Test summary'
    }
  };
}

function createTestShowWithNetwork(name: string, networkName: string): Show {
  const show = createTestShow(name, 'Scripted');
  show.show.network = { id: Math.floor(Math.random() * 1000), name: networkName, country: null };
  return show;
}

function createTestShowWithGenres(name: string, genres: string[]): Show {
  const show = createTestShow(name, 'Scripted');
  show.show.genres = genres;
  return show;
}

function createTestShowWithLanguage(name: string, language: string): Show {
  const show = createTestShow(name, 'Scripted');
  show.show.language = language;
  return show;
}
