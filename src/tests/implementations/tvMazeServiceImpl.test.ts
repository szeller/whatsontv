/**
 * Tests for TVMaze service implementation
 */
import 'reflect-metadata';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { container } from 'tsyringe';
import { TvMazeServiceImpl } from '../../implementations/tvMazeServiceImpl.js';
import type { HttpClient } from '../../interfaces/httpClient.js';
import { MockHttpClient } from '../testutils/mockHttpClient.js';
import { getNetworkScheduleUrl, getWebScheduleUrl } from '../../utils/tvMazeUtils.js';
import { getTodayDate } from '../../utils/dateUtils.js';
import { 
  NetworkBuilder, 
  TvMazeScheduleItemBuilder 
} from '../fixtures/helpers/tvMazeFixtureBuilder.js';

describe('TvMazeServiceImpl', () => {
  let tvMazeService: TvMazeServiceImpl;
  let mockHttpClient: MockHttpClient;

  beforeEach(() => {
    // Clear any previous registrations
    container.clearInstances();

    // Create a new mock HTTP client for each test
    mockHttpClient = new MockHttpClient();

    // Register the mock HTTP client with the DI container
    container.registerInstance<HttpClient>('HttpClient', mockHttpClient);

    // Create the service under test
    tvMazeService = new TvMazeServiceImpl(mockHttpClient);
  });

  describe('constructor', () => {
    it('creates a new instance with the provided HTTP client', () => {
      // Clear any previous registrations
      container.clearInstances();

      // Create a new mock HTTP client
      const httpClient = new MockHttpClient();

      // Create the service with the mock client
      const service = new TvMazeServiceImpl(httpClient);

      // Verify the service was created
      expect(service).toBeInstanceOf(TvMazeServiceImpl);
    });
  });

  describe('fetchShows', () => {
    it('returns shows for a specific date', async () => {
      // Create test fixture data using the builder
      const scheduleItems = TvMazeScheduleItemBuilder.createNetworkScheduleItems(
        3,
        {
          airdate: '2023-01-01'
        }
      );

      // Mock the HTTP client for this specific endpoint
      mockHttpClient.mockGet(
        getNetworkScheduleUrl('2023-01-01', 'US'),
        {
          data: scheduleItems,
          status: 200,
          headers: {}
        }
      );

      // Call the method under test
      const shows = await tvMazeService.fetchShows({ date: '2023-01-01' });

      // Verify the result
      expect(shows.length).toBe(3);
      expect(shows[0].id).toBe(100);
      expect(shows[1].id).toBe(101);
      expect(shows[2].id).toBe(102);
    });

    it('fetches shows for today', async () => {
      // Create test fixture data using the builder
      const todayDate = getTodayDate(); // Format: YYYY-MM-DD
      const scheduleItems = TvMazeScheduleItemBuilder.createNetworkScheduleItems(
        2,
        {
          airdate: todayDate
        }
      );

      // Mock the HTTP client for this specific endpoint
      mockHttpClient.mockGet(
        getNetworkScheduleUrl(todayDate, 'US'),
        {
          data: scheduleItems,
          status: 200,
          headers: {}
        }
      );

      // Call the method under test with no date (defaults to today)
      const shows = await tvMazeService.fetchShows();

      // Verify the result
      expect(shows.length).toBe(2);
    });

    it('handles empty responses', async () => {
      // Mock empty response
      mockHttpClient.mockGet(
        getNetworkScheduleUrl('2099-01-01', 'US'),
        {
          data: [],
          status: 200,
          headers: {}
        }
      );

      // Call the method under test with a future date that has no shows
      const shows = await tvMazeService.fetchShows({ date: '2099-01-01' });

      // Verify the result is an empty array
      expect(shows).toEqual([]);
    });

    it('handles HTTP errors', async () => {
      // Mock an HTTP error
      mockHttpClient.mockGetError(
        getNetworkScheduleUrl('2023-01-01', 'US'),
        new Error('Network error')
      );

      // Call the method under test
      const shows = await tvMazeService.fetchShows({ date: '2023-01-01' });

      // Verify the result is an empty array on error
      expect(shows).toEqual([]);
    });

    it('transforms schedule data correctly', async () => {
      // Create a network with specific details
      const network = new NetworkBuilder()
        .withId(1)
        .withName('Test Network')
        .withCountry({
          name: 'United States',
          code: 'US',
          timezone: 'America/New_York'
        })
        .build();

      // Create a schedule item with specific details
      const todayDate = getTodayDate();
      const scheduleItem = TvMazeScheduleItemBuilder.createNetworkScheduleItem({
        id: 1,
        name: 'Test Episode',
        season: 1,
        number: 1,
        airdate: todayDate,
        airtime: '20:00',
        showId: 100,
        showName: 'Test Show Title',
        network
      });

      // Mock the HTTP client with our fixture data
      mockHttpClient.mockGet(
        getNetworkScheduleUrl(todayDate, 'US'),
        {
          data: [scheduleItem],
          status: 200,
          headers: {}
        }
      );

      // Call the method under test
      const shows = await tvMazeService.fetchShows({ date: todayDate });

      // Verify the result has been transformed correctly
      expect(shows.length).toBe(1);
      expect(shows[0].id).toBe(100);
      expect(shows[0].name).toBe('Test Show Title');
      expect(shows[0].network).toBe('Test Network (US)');
    });

    it('fetches web-only shows', async () => {
      // Create test fixture data for web shows
      const todayDate = getTodayDate();
      const webScheduleItems = TvMazeScheduleItemBuilder.createWebScheduleItems(
        3,
        {
          airdate: todayDate
        }
      );

      // Mock the web schedule endpoint
      mockHttpClient.mockGet(
        getWebScheduleUrl(todayDate),
        {
          data: webScheduleItems,
          status: 200,
          headers: {}
        }
      );

      // Call the method under test with the web source
      const shows = await tvMazeService.fetchShows({ fetchSource: 'web' });

      // Verify the result
      expect(shows.length).toBe(3);
      expect(shows[0].id).toBe(200);
      // Web shows don't have country code
      expect(shows[0].network).not.toContain('(US)');
    });

    it('fetches both network and web shows when fetchSource is all', async () => {
      // Create test fixture data using the mixed schedule items helper
      const todayDate = getTodayDate();
      const mixedItems = TvMazeScheduleItemBuilder.createMixedScheduleItems(
        2, // network items
        2, // web items
        { airdate: todayDate }
      );
      
      // Split the items into network and web for mocking
      const networkItems = mixedItems.slice(0, 2);
      const webItems = mixedItems.slice(2);

      // Mock both endpoints
      mockHttpClient.mockGet(
        getNetworkScheduleUrl(todayDate, 'US'),
        {
          data: networkItems,
          status: 200,
          headers: {}
        }
      );

      mockHttpClient.mockGet(
        getWebScheduleUrl(todayDate),
        {
          data: webItems,
          status: 200,
          headers: {}
        }
      );

      // Call the method under test with 'all' source
      const shows = await tvMazeService.fetchShows({ fetchSource: 'all' });

      // Verify the result includes shows from both sources
      expect(shows.length).toBe(4);

      // Verify we have both network and web shows
      const networkShowIds = shows
        .filter(show => show.id >= 100 && show.id < 200)
        .map(show => show.id);
      const webShowIds = shows
        .filter(show => show.id >= 200)
        .map(show => show.id);

      expect(networkShowIds).toHaveLength(2);
      expect(webShowIds).toHaveLength(2);
    });
  });
});
