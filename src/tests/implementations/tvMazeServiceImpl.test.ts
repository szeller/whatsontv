/**
 * Tests for the TvMazeServiceImpl implementation
 */
import 'reflect-metadata';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { container } from 'tsyringe';
import { TvMazeServiceImpl } from '../../implementations/tvMazeServiceImpl.js';
import type { HttpClient } from '../../interfaces/httpClient.js';
import type { Show } from '../../types/tvShowModel.js';
import { TvMazeFixtures } from '../fixtures/tvmaze/tvMazeFixtures.js';
import { getNetworkScheduleUrl, getWebScheduleUrl } from '../../utils/tvMazeUtils.js';
import { MockHttpClient } from '../utils/mockHttpClient.js';
import { getTodayDate } from '../../utils/dateUtils.js';

describe('TvMazeServiceImpl', () => {
  let tvMazeService: TvMazeServiceImpl;
  let mockHttpClient: MockHttpClient;
  let _mockShowData: Show; // Prefixed with _ to indicate it's not directly used
  
  beforeEach(() => {
    // Reset container for each test
    container.clearInstances();
    
    // Create a mock show for testing
    _mockShowData = {
      id: 1,
      name: 'NCIS',
      type: 'Scripted',
      language: 'English',
      genres: ['Drama', 'Crime'],
      network: 'CBS',
      summary: 'NCIS is a show about naval criminal investigators.',
      airtime: '20:00',
      season: 1,
      number: 1
    };

    // Create a mock HttpClient
    mockHttpClient = new MockHttpClient();
    container.registerInstance<HttpClient>('HttpClient', mockHttpClient);
    
    // Create the service instance
    tvMazeService = new TvMazeServiceImpl(mockHttpClient);
  });
  
  describe('fetchShows', () => {
    it('returns shows for a specific date', async () => {
      // Mock the HTTP client for this specific endpoint
      mockHttpClient.mockGet(getNetworkScheduleUrl('2023-01-01', 'US'), {
        data: TvMazeFixtures.getNetworkSchedule(),
        status: 200,
        headers: {}
      });

      const result = await tvMazeService.fetchShows({ date: '2023-01-01' });
      expect(result.length).toBeGreaterThan(0);
    });

    it('fetches shows for today', async () => {
      // Mock the HTTP client for this specific endpoint
      const todayDate = getTodayDate(); // Format: YYYY-MM-DD
      mockHttpClient.mockGet(getNetworkScheduleUrl(todayDate, 'US'), {
        data: TvMazeFixtures.getNetworkSchedule(),
        status: 200,
        headers: {}
      });

      const result = await tvMazeService.fetchShows({ date: todayDate });
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles empty responses', async () => {
      // Mock empty response
      mockHttpClient.mockGet(getNetworkScheduleUrl('2099-01-01', 'US'), {
        data: [],
        status: 200,
        headers: {}
      });

      const result = await tvMazeService.fetchShows({ date: '2099-01-01' });
      expect(result).toHaveLength(0);
    });

    it('applies multiple filters', async () => {
      // Mock the HTTP client for this specific endpoint
      const todayDate = getTodayDate();
      
      // Create a properly typed mock show that will match our filter criteria
      const mockShow = {
        id: 1,
        url: 'https://www.tvmaze.com/episodes/1',
        name: 'Test Episode',
        season: 1,
        number: 1,
        type: 'regular',
        airdate: todayDate,
        airtime: '20:00',
        airstamp: `${todayDate}T20:00:00-05:00`,
        runtime: 60,
        rating: { average: 8.5 },
        image: null,
        summary: '<p>Test episode summary</p>',
        show: {
          id: 1,
          url: 'https://www.tvmaze.com/shows/1',
          name: 'Test Show',
          type: 'Scripted',
          language: 'English',
          genres: ['Drama'],
          status: 'Running',
          runtime: 60,
          premiered: '2023-01-01',
          officialSite: 'https://www.example.com',
          schedule: { time: '20:00', days: ['Monday'] },
          rating: { average: 8.5 },
          weight: 100,
          network: {
            id: 1,
            name: 'ABC',
            country: {
              name: 'United States',
              code: 'US',
              timezone: 'America/New_York'
            }
          },
          webChannel: null,
          externals: { tvrage: null, thetvdb: null, imdb: null },
          image: null,
          summary: '<p>Test show summary</p>',
          updated: 1609459200,
          _links: { self: { href: 'https://api.tvmaze.com/shows/1' } }
        }
      };
      
      // Mock the HTTP client with our mock data
      mockHttpClient.mockGet(getNetworkScheduleUrl(todayDate, 'US'), {
        data: [mockShow],
        status: 200,
        headers: {}
      });
      
      // Call the method being tested with filters that match our mock show
      const result = await tvMazeService.fetchShows({
        types: ['Scripted'],
        networks: ['ABC'],
        genres: ['Drama'],
        languages: ['English']
      });

      expect(result.length).toBeGreaterThan(0);
    });
    
    it('fetches web-only shows', async () => {
      // Mock the web schedule endpoint
      const todayDate = getTodayDate();
      mockHttpClient.mockGet(getWebScheduleUrl(todayDate), {
        data: TvMazeFixtures.getWebSchedule(),
        status: 200,
        headers: {}
      });
      
      const result = await tvMazeService.fetchShows({ webOnly: true });
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].network).toMatch(/^Apple TV\+$/);
    });
    
    it('fetches both network and web shows when showAll is true', async () => {
      // Mock both endpoints
      const todayDate = getTodayDate();
      mockHttpClient.mockGet(getNetworkScheduleUrl(todayDate, 'US'), {
        data: TvMazeFixtures.getNetworkSchedule(),
        status: 200,
        headers: {}
      });
      
      mockHttpClient.mockGet(getWebScheduleUrl(todayDate), {
        data: TvMazeFixtures.getWebSchedule(),
        status: 200,
        headers: {}
      });
      
      const result = await tvMazeService.fetchShows({ showAll: true });
      
      expect(result.length).toBeGreaterThan(0);
      // Verify we have both types of shows
      const networkShowsCount = result.filter(show => !show.network?.match(/^Apple TV\+$/)).length;
      const webShowsCount = result.filter(show => show.network?.match(/^Apple TV\+$/)).length;
      expect(networkShowsCount).toBeGreaterThan(0);
      expect(webShowsCount).toBeGreaterThan(0);
    });
  });
});
