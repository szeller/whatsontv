/**
 * Tests for the ShowUtils utility functions
 */
import { jest, describe, it, expect } from '@jest/globals';

// Import the functions to test
import { 
  getTodayDate, 
  groupShowsByNetwork, 
  sortShowsByTime, 
  normalizeShowData 
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
          airtime: '15:30',
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

    it('puts shows with no airtime at the end', () => {
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
          airtime: '20:00',
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

  describe('normalizeShowData', () => {
    it('normalizes complete show data', () => {
      // Create test data
      const rawShow = {
        name: 'Test Show',
        season: 2,
        number: 5,
        airtime: '20:00',
        show: {
          name: 'Test Show',
          type: 'Scripted',
          language: 'English',
          genres: ['Drama', 'Comedy'],
          network: { id: 1, name: 'Test Network', country: null },
          webChannel: null,
          image: { medium: 'test.jpg', original: 'test_large.jpg' },
          summary: 'Test summary'
        }
      };

      // Test the function
      const result = normalizeShowData(rawShow);
      
      // Assert the result
      expect(result).toEqual(rawShow);
    });

    it('fills in missing data with defaults', () => {
      // Create test data with minimal information
      const rawShow = {
        id: 123,
        airtime: '', 
        show: {
          id: 123,
          name: '',
          type: '',
          language: '',
          genres: [],
          network: null,
          webChannel: null,
          image: null,
          summary: ''
        }
      };

      // Test the function
      const result = normalizeShowData(rawShow);
      
      // Assert the result
      expect(result).toEqual({
        name: '', 
        season: 0,
        number: 0,
        airtime: '',
        show: {
          id: 123,
          name: 'Unknown Show', 
          type: 'Unknown',      
          language: '',
          genres: [],
          network: null,
          webChannel: null,
          image: null,
          summary: ''
        }
      });
    });
  });
});
