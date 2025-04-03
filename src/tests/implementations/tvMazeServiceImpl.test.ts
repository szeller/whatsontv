/**
 * Tests for TVMaze service implementation
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { container } from 'tsyringe';
import { TvMazeServiceImpl } from '../../implementations/tvMazeServiceImpl.js';
import type { HttpClient } from '../../interfaces/httpClient.js';
import { createMockHttpClient } from '../mocks/factories/httpClientFactory.js';
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
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    // Clear any previous registrations
    container.clearInstances();

    // Create a new mock HTTP client for each test
    mockHttpClient = createMockHttpClient();

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
      const httpClient = createMockHttpClient();

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
      jest.spyOn(mockHttpClient, 'get').mockResolvedValueOnce({
        data: scheduleItems,
        status: 200,
        headers: {}
      });

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
      jest.spyOn(mockHttpClient, 'get').mockResolvedValueOnce({
        data: scheduleItems,
        status: 200,
        headers: {}
      });

      // Call the method under test with no date (defaults to today)
      const shows = await tvMazeService.fetchShows();

      // Verify the result
      expect(shows.length).toBe(2);
    });

    it('handles empty responses', async () => {
      // Mock empty response
      jest.spyOn(mockHttpClient, 'get').mockResolvedValueOnce({
        data: [],
        status: 200,
        headers: {}
      });

      // Call the method under test with a future date that has no shows
      const shows = await tvMazeService.fetchShows({ date: '2099-01-01' });

      // Verify the result is an empty array
      expect(shows).toEqual([]);
    });

    it('handles HTTP errors', async () => {
      // Mock an HTTP error
      jest.spyOn(mockHttpClient, 'get').mockRejectedValueOnce(
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

      // Create a schedule item with the network and show
      const scheduleItem = TvMazeScheduleItemBuilder.createNetworkScheduleItem({
        id: 100,
        name: 'Test Show',
        network: network,
        airdate: '2023-01-01'
      });

      // Mock the HTTP client response
      jest.spyOn(mockHttpClient, 'get').mockResolvedValueOnce({
        data: [scheduleItem],
        status: 200,
        headers: {}
      });

      // Call the method under test
      const shows = await tvMazeService.fetchShows({ date: '2023-01-01' });

      // Verify the result has been transformed correctly
      expect(shows.length).toBe(1);
      expect(shows[0].id).toBe(100);
      expect(shows[0].name).toBe('Test Show');
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

      // Mock the HTTP client for the web schedule endpoint
      jest.spyOn(mockHttpClient, 'get').mockResolvedValueOnce({
        data: webScheduleItems,
        status: 200,
        headers: {}
      });

      // Call the method under test with web source
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
      
      // Mock the HTTP client for both endpoints
      jest.spyOn(mockHttpClient, 'get').mockImplementation((url) => {
        if (url.includes('web')) {
          return Promise.resolve({
            data: webItems,
            status: 200,
            headers: {}
          });
        } else {
          return Promise.resolve({
            data: networkItems,
            status: 200,
            headers: {}
          });
        }
      });
      
      // Call the method under test with 'all' source
      const shows = await tvMazeService.fetchShows({
        fetchSource: 'all'
      });
      
      // Verify we have shows from both sources
      expect(shows.length).toBe(4);
      
      // Since we can't easily distinguish network vs web shows 
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
      jest.spyOn(mockHttpClient, 'get').mockResolvedValueOnce({
        data: { error: 'Invalid data' },
        status: 200,
        headers: {}
      });

      // Call the method under test
      const shows = await tvMazeService.fetchShows({ date: '2023-01-01' });

      // Verify the result is an empty array
      expect(shows).toEqual([]);
    });
    
    it('handles errors in the getSchedule method', async () => {
      // Save the original NODE_ENV and set it to production to test error logging
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock an HTTP error
      jest.spyOn(mockHttpClient, 'get').mockRejectedValueOnce(
        new Error('Network error')
      );
      
      // Call the method under test - it handles the error internally and returns an empty array
      const result = await tvMazeService['getSchedule']('2023-01-01');
      
      // Verify the result is an empty array
      expect(result).toEqual([]);
      
      // Verify that console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      // Restore NODE_ENV and console.error
      process.env.NODE_ENV = originalNodeEnv;
      consoleErrorSpy.mockRestore();
    });
    
    it('handles errors in the fetchShows method', async () => {
      // Mock the HTTP client to throw an error
      jest.spyOn(mockHttpClient, 'get').mockRejectedValueOnce(
        new Error('Network error')
      );

      // Save the original NODE_ENV and set it to development to test error logging
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
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
    // Create a test class that exposes the protected applyFilters method
    class TestTvMazeService extends TvMazeServiceImpl {
      constructor(httpClient: HttpClient) {
        super(httpClient);
      }
      
      // Create a public method that calls the protected method
      public testApplyFilters(shows: Show[], options: ShowOptions): Show[] {
        // Use type assertion to access the protected method
        return this['applyFilters'](shows, options);
      }
    }
    
    let testService: TestTvMazeService;
    let testShows: Show[];
    
    beforeEach(() => {
      // Create a test service instance
      testService = new TestTvMazeService(mockHttpClient);
      
      // Create test shows with different properties for filtering
      testShows = [
        new ShowBuilder()
          .withId(1)
          .withName('Drama Show')
          .withNetwork('ABC')
          .withLanguage('English')
          .withType('Scripted')
          .withGenres(['Drama'])
          .withSummary('A dramatic show')
          .withAirtime('20:00')
          .withEpisode(1, 1)
          .build(),
        new ShowBuilder()
          .withId(2)
          .withName('Reality Show')
          .withNetwork('CBS')
          .withLanguage('Spanish')
          .withType('Reality')
          .withGenres(['Reality'])
          .withSummary('A reality show')
          .withAirtime('21:00')
          .withEpisode(1, 2)
          .build(),
        new ShowBuilder()
          .withId(3)
          .withName('Comedy Show')
          .withNetwork('Netflix')
          .withLanguage('English')
          .withType('Variety')
          .withGenres(['Comedy', 'Talk Show'])
          .withSummary('A comedy show')
          .withAirtime('22:00')
          .withEpisode(1, 3)
          .build(),
        new ShowBuilder()
          .withId(4)
          .withName('Mystery Show')
          .withNetwork('HBO')
          .withLanguage('French')
          .withType('Scripted')
          .withGenres(['Mystery', 'Thriller'])
          .withSummary('A mystery show')
          .withAirtime('23:00')
          .withEpisode(1, 4)
          .build()
      ];
    });
    
    it('returns all shows when no filters are applied', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
        fetchSource: 'all',
        types: [],
        genres: [],
        languages: [],
        networks: []
      });
      
      expect(result.length).toBe(4);
      expect(result).toEqual(testShows);
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
