/**
 * Tests for TVMaze service implementation
 */
import 'reflect-metadata';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
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
import { ShowBuilder } from '../fixtures/helpers/showFixtureBuilder.js';
import type { Show } from '../../schemas/domain.js';
import type { ShowOptions } from '../../types/tvShowOptions.js';

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

      // Call the method under test with web-only fetch source
      const shows = await tvMazeService.fetchShows({
        fetchSource: 'web'
      });

      // Verify the result
      expect(shows.length).toBe(3);
      expect(shows[0].network).toBeTruthy();
    });

    it('fetches both network and web shows when fetchSource is all', async () => {
      // Create test fixture data using the builder
      const todayDate = getTodayDate();
      
      // Create network schedule items
      const networkItems = TvMazeScheduleItemBuilder.createNetworkScheduleItems(
        2,
        {
          airdate: todayDate
        }
      );
      
      // Create web schedule items
      const webItems = TvMazeScheduleItemBuilder.createWebScheduleItems(
        2,
        {
          airdate: todayDate
        }
      );

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

      // Call the method under test with 'all' fetch source
      const shows = await tvMazeService.fetchShows({
        fetchSource: 'all'
      });

      // Verify the result contains shows from both sources
      expect(shows.length).toBe(4);
      
      // Since we can't reliably determine which shows are from network vs web
      // based on the network name alone (depends on implementation details),
      // we'll just verify that we have shows from both sources based on ID ranges
      // The TvMazeScheduleItemBuilder typically uses IDs 100+ for network and 200+ for web
      const networkShowIds = shows
        .filter(show => show.id >= 100 && show.id < 200)
        .map(show => show.id);
      const webShowIds = shows
        .filter(show => show.id >= 200)
        .map(show => show.id);
      
      expect(networkShowIds.length).toBe(2);
      expect(webShowIds.length).toBe(2);
    });
    
    it('handles non-array response data', async () => {
      // Mock a response with non-array data
      mockHttpClient.mockGet(
        getNetworkScheduleUrl('2023-01-01', 'US'),
        {
          data: { error: 'Invalid data format' }, // Not an array
          status: 200,
          headers: {}
        }
      );

      // Call the method under test
      const shows = await tvMazeService.fetchShows({ date: '2023-01-01' });

      // Verify the result is an empty array
      expect(shows).toEqual([]);
    });
    
    it('handles errors in the getSchedule method', async () => {
      // Mock an HTTP error
      mockHttpClient.mockGetError(
        getNetworkScheduleUrl('2023-01-01', 'US'),
        new Error('Network error')
      );

      // Save the original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      // Set NODE_ENV to production to test the error logging path
      process.env.NODE_ENV = 'production';
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error');
      consoleErrorSpy.mockImplementation(() => {});

      // Call the method under test
      const shows = await tvMazeService.fetchShows({ date: '2023-01-01' });

      // Verify the result is an empty array
      expect(shows).toEqual([]);
      
      // Verify that console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      // Restore NODE_ENV and console.error
      process.env.NODE_ENV = originalNodeEnv;
      consoleErrorSpy.mockRestore();
    });
    
    it('handles errors in the fetchShows method', async () => {
      // Mock the HTTP client to throw an error
      mockHttpClient.mockGetError(
        getNetworkScheduleUrl('2023-01-01', 'US'),
        new Error('Network error')
      );

      // Save the original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      // Set NODE_ENV to production to test the error logging path
      process.env.NODE_ENV = 'production';
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error');
      consoleErrorSpy.mockImplementation(() => {});

      // Call the method under test
      const shows = await tvMazeService.fetchShows({ date: '2023-01-01' });

      // Verify the result is an empty array
      expect(shows).toEqual([]);
      
      // Restore NODE_ENV and console.error
      process.env.NODE_ENV = originalNodeEnv;
      consoleErrorSpy.mockRestore();
    });
  });
  
  describe('applyFilters', () => {
    // Create a test class that exposes the private applyFilters method
    class TestTvMazeService extends TvMazeServiceImpl {
      public testApplyFilters(shows: Show[], options: ShowOptions): Show[] {
        return this['applyFilters'](shows, options);
      }
    }
    
    let testService: TestTvMazeService;
    let testShows: Show[];
    
    beforeEach(() => {
      testService = new TestTvMazeService(mockHttpClient);
      
      // Create test shows with different properties
      testShows = [
        new ShowBuilder()
          .withId(1)
          .withName('Show 1')
          .withType('Scripted')
          .withLanguage('English')
          .withGenres(['Drama'])
          .withNetwork('ABC')
          .build(),
        new ShowBuilder()
          .withId(2)
          .withName('Show 2')
          .withType('Reality')
          .withLanguage('Spanish')
          .withGenres(['Reality'])
          .withNetwork('NBC')
          .build(),
        new ShowBuilder()
          .withId(3)
          .withName('Show 3')
          .withType('Animation')
          .withLanguage('English')
          .withGenres(['Comedy', 'Animation'])
          .withNetwork('Netflix')
          .build(),
        new ShowBuilder()
          .withId(4)
          .withName('Show 4')
          .withType('Scripted')
          .withLanguage('French')
          .withGenres(['Drama', 'Thriller'])
          .withNetwork('HBO')
          .build()
      ];
    });
    
    it('handles empty shows array', () => {
      const result = testService.testApplyFilters([], {
        date: '',
        country: 'US',
        fetchSource: 'all',
        types: [],
        genres: [],
        languages: [],
        networks: []
      });
      
      expect(result).toEqual([]);
    });
    
    it('applies type filter correctly', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
        fetchSource: 'all',
        types: ['Scripted'],
        genres: [],
        languages: [],
        networks: []
      });
      
      expect(result.length).toBe(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(4);
      expect(result.every(show => show.type === 'Scripted')).toBe(true);
    });
    
    it('applies network filter correctly', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
        fetchSource: 'all',
        types: [],
        genres: [],
        languages: [],
        networks: ['Netflix', 'HBO']
      });
      
      expect(result.length).toBe(2);
      expect(result[0].id).toBe(3);
      expect(result[1].id).toBe(4);
      expect(result.every(show => 
        show.network === 'Netflix' || show.network === 'HBO'
      )).toBe(true);
    });
    
    it('applies genre filter correctly', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
        fetchSource: 'all',
        types: [],
        genres: ['Comedy'],
        languages: [],
        networks: []
      });
      
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(3);
      expect(result[0].genres).toContain('Comedy');
    });
    
    it('applies language filter correctly', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
        fetchSource: 'all',
        types: [],
        genres: [],
        languages: ['English'],
        networks: []
      });
      
      expect(result.length).toBe(2);
      
      // Check each show's language explicitly to handle null/undefined
      result.forEach(show => {
        expect(show.language).toBe('English');
      });
    });
    
    it('handles case insensitive language matching', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
        fetchSource: 'all',
        types: [],
        genres: [],
        languages: ['english'], // lowercase
        networks: []
      });
      
      expect(result.length).toBe(2);
      
      // Check each show's language explicitly to handle null/undefined
      result.forEach(show => {
        expect(show.language?.toLowerCase()).toBe('english');
      });
    });
    
    it('applies multiple filters correctly', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
        fetchSource: 'all',
        types: ['Scripted'],
        genres: ['Drama'],
        languages: ['English'],
        networks: []
      });
      
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(1);
      expect(result[0].type).toBe('Scripted');
      expect(result[0].genres).toContain('Drama');
      expect(result[0].language).toBe('English');
    });
    
    it('handles case insensitive type matching', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
        fetchSource: 'all',
        types: ['scripted'], // lowercase
        genres: [],
        languages: [],
        networks: []
      });
      
      expect(result.length).toBe(2);
      expect(result.every(show => show.type.toLowerCase() === 'scripted')).toBe(true);
    });
    
    it('handles case insensitive network matching', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
        fetchSource: 'all',
        types: [],
        genres: [],
        languages: [],
        networks: ['netflix'] // lowercase
      });
      
      expect(result.length).toBe(1);
      expect(result[0].network).toBe('Netflix');
    });
    
    it('handles case insensitive genre matching', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
        fetchSource: 'all',
        types: [],
        genres: ['comedy'], // lowercase
        languages: [],
        networks: []
      });
      
      expect(result.length).toBe(1);
      expect(result[0].genres).toContain('Comedy');
    });
  });
});
