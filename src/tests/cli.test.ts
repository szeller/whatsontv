import { jest, describe, it, expect, beforeEach } from '@jest/globals';
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
  name: 'Test Show',
  show: mockShowDetails,
  season: 1,
  number: 1
};

// Mock date for consistent testing
const MOCK_DATE = '2025-03-19';

// Mock the module before any imports that use it
jest.mock('../services/tvShowService.js', () => ({
  getTodayDate: mockGetTodayDate,
  fetchTvShows: mockFetchTvShows
}));

describe('cli', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetTodayDate.mockReturnValue(MOCK_DATE);
    mockFetchTvShows.mockResolvedValue([mockShow]);
  });

  describe('parseArgs', () => {
    it('should use default values when no arguments provided', async () => {
      const { parseArgs } = await import('../cli.js');

      const args = parseArgs([]);

      // Check specific fields we care about
      expect(args).toMatchObject({
        _: [],
        c: 'US',
        country: 'US',
        d: MOCK_DATE,
        date: MOCK_DATE
      });

      // Check array fields using arrayContaining
      expect(args.g).toEqual(expect.arrayContaining(config.genres));
      expect(args.genres).toEqual(expect.arrayContaining(config.genres));
    });

    it('should parse command line arguments correctly', async () => {
      const { parseArgs } = await import('../cli.js');

      const args = parseArgs([
        '--date', MOCK_DATE,
        '--country', 'US',
        '--types', 'Reality',
        '--networks', 'CBS',
        '--genres', 'Drama'
      ]);

      // Check specific fields we care about
      expect(args).toMatchObject({
        date: MOCK_DATE,
        d: MOCK_DATE,
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
});
