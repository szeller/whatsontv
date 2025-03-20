import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

import config from '../../config.js';
import { parseArgs, displayShows } from '../../services/consoleOutput.js';
import { getTodayDate } from '../../services/tvShowService.js';
import type { Show, ShowDetails } from '../../types/tvmaze.js';
import { consoleOutput } from '../../utils/console.js';

// Create mock show data for testing
const mockShowDetails: ShowDetails = {
  id: 1,
  name: 'Test Show',
  type: 'Reality',
  language: 'English',
  genres: ['Drama'],
  network: {
    id: 2,
    name: 'CBS',
    country: {
      name: 'United States',
      code: 'US',
      timezone: 'America/New_York'
    }
  },
  webChannel: null,
  image: null,
  summary: 'Test show summary'
};

const mockShow: Show = {
  airtime: '20:00',
  name: 'Test Show',
  show: mockShowDetails,
  season: 1,
  number: 1
};

// Create spies for console functions
const consoleLogSpy = jest.spyOn(consoleOutput, 'log').mockImplementation(() => {});
const _consoleErrorSpy = jest.spyOn(consoleOutput, 'error').mockImplementation(() => {});

// Create spies for console.log to prevent actual console output during tests
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('consoleOutput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('parseArgs', () => {
    it('should use default values when no arguments provided', () => {
      const todayDate = getTodayDate();
      const args = parseArgs([]);

      // Check specific fields we care about
      expect(args).toMatchObject({
        _: [],
        c: 'US',
        country: 'US'
      });
      
      // Check that date properties exist and match the actual today's date
      expect(args.d).toBe(todayDate);
      expect(args.date).toBe(todayDate);

      // Check array fields using arrayContaining
      expect(args.g).toEqual(expect.arrayContaining(config.genres));
      expect(args.genres).toEqual(expect.arrayContaining(config.genres));
    });

    it('should parse command line arguments correctly', () => {
      const testDate = '2025-01-01';

      const args = parseArgs([
        '--date', testDate,
        '--country', 'US',
        '--types', 'Reality',
        '--networks', 'CBS',
        '--genres', 'Drama'
      ]);

      // Check specific fields we care about
      expect(args).toMatchObject({
        date: testDate,
        d: testDate,
        country: 'US',
        c: 'US',
        types: ['Reality'],
        t: ['Reality'],
        networks: ['CBS'],
        n: ['CBS'],
        genres: ['Drama'],
        g: ['Drama']
      });
    });
  });

  describe('displayShows', () => {
    it('should display TV shows grouped by network when timeSort is false', () => {
      // Call the function with shows and timeSort=false
      displayShows([mockShow], false);
      
      // Verify console.log was called at least once
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should display TV shows sorted by time when timeSort is true', () => {
      // Call the function with shows and timeSort=true
      displayShows([mockShow], true);
      
      // Verify console.log was called at least once
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle empty show results', () => {
      // Call the function with empty shows array
      displayShows([], false);
      
      // Verify console.log was called with the "No shows found" message
      expect(consoleLogSpy).toHaveBeenCalledWith('No shows found for the specified criteria.');
    });
  });
});
