import { jest, describe, it, expect } from '@jest/globals';
import type { Show, ShowDetails } from '../types/tvmaze.js';
import config from '../config.js';

// Mock tvShowService with explicit types
const mockGetTodayDate = jest.fn<() => string>();
const mockFetchTvShows = jest.fn<() => Promise<Show[]>>();

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
  name: 'Test Episode',
  season: 1,
  number: 1,
  show: mockShowDetails
};

// Set up mock implementations with explicit types
const mockDate = '2025-03-19';
mockGetTodayDate.mockImplementation(() => mockDate);
mockFetchTvShows.mockImplementation(async () => [mockShow]);

// Mock the module
jest.mock('../services/tvShowService.js', () => ({
  getTodayDate: mockGetTodayDate,
  fetchTvShows: mockFetchTvShows
}));

describe('cli', () => {
  beforeEach((): void => {
    // Clear module cache and mocks
    jest.resetModules();
    jest.clearAllMocks();
    
    // Reset getTodayDate mock for each test
    mockGetTodayDate.mockImplementation(() => mockDate);
  });

  describe('parseArgs', () => {
    it('should parse command line arguments correctly', async (): Promise<void> => {
      const { parseArgs } = await import('../cli.js');
      const args = parseArgs([
        '--date', mockDate,
        '--country', 'US',
        '--types', 'Reality',
        '--networks', 'CBS',
        '--genres', 'Drama',
        '--languages', 'English'
      ]);

      // Include aliases in expected args as yargs adds them
      const expectedArgs = {
        date: mockDate,
        d: mockDate,
        country: 'US',
        c: 'US',
        types: ['Reality'],
        t: ['Reality'],
        networks: ['CBS'],
        n: ['CBS'],
        genres: ['Drama'],
        g: ['Drama'],
        languages: ['English'],
        l: ['English'],
        timeSort: false,
        's': false,
        'time-sort': false,
        _: [] as string[],
        $0: expect.stringMatching(/.*/)
      };

      expect(args).toEqual(expect.objectContaining(expectedArgs));
    });

    it('should use default values when no arguments provided', async (): Promise<void> => {
      const { parseArgs } = await import('../cli.js');
      const args = parseArgs([]);

      // Include aliases in expected args as yargs adds them
      const expectedArgs = {
        date: mockDate,
        d: mockDate,
        country: config.country,
        c: config.country,
        types: config.types,
        t: config.types,
        networks: config.networks,
        n: config.networks,
        genres: config.genres,
        g: config.genres,
        languages: config.languages,
        l: config.languages,
        timeSort: false,
        's': false,
        'time-sort': false,
        _: [] as string[]
      };

      expect(args).toEqual(expect.objectContaining(expectedArgs));
    });
  });
});
