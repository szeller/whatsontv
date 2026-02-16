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
import type { Show } from '../../schemas/domain.js';
import type { ShowOptions } from '../../types/tvShowOptions.js';
import { expectValidShow, createTestShows } from '../utils/assertions.js';

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
      expectValidShow(shows[0]);
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
      shows.forEach(show => {
        expectValidShow(show);
      });
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

      // Create a schedule item with the show
      const scheduleItem = TvMazeScheduleItemBuilder.createNetworkScheduleItem({
        id: 100,
        name: 'Test Show',
        network,
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
      expectValidShow(shows[0]);
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

      // Mock the HTTP client for web channel endpoint
      jest.spyOn(mockHttpClient, 'get').mockResolvedValueOnce({
        data: webScheduleItems,
        status: 200,
        headers: {}
      });

      // Call the method under test
      const shows = await tvMazeService.fetchShows();

      // Verify the result
      expect(shows.length).toBe(3);
      expectValidShow(shows[0]);
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
      
      // Mock the HTTP client for network endpoint
      jest.spyOn(mockHttpClient, 'get')
        .mockResolvedValueOnce({
          data: networkItems,
          status: 200,
          headers: {}
        })
        // Mock the HTTP client for web endpoint (second call)
        .mockResolvedValueOnce({
          data: webItems,
          status: 200,
          headers: {}
        });
      
      // Call the method under test
      const shows = await tvMazeService.fetchShows();
      
      // Verify the result
      expect(shows.length).toBe(4);
      shows.forEach(show => {
        expectValidShow(show);
      });
      
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
      
      // Mock the HTTP client to throw an error
      jest.spyOn(mockHttpClient, 'get').mockRejectedValueOnce(
        new Error('Network error')
      );
      
      // Call the method under test
      const shows = await tvMazeService.fetchShows({ date: '2023-01-01' });
      
      // Verify the result is an empty array
      expect(shows).toEqual([]);
      
      // Note: Error logging is now handled by LoggerService instead of console.error
      // The service will gracefully handle errors and return empty array
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
    
    it('handles errors in the fetchShows method', async () => {
      // Mock the HTTP client to throw an error
      jest.spyOn(mockHttpClient, 'get').mockRejectedValueOnce(
        new Error('Network error')
      );

      // Save the original NODE_ENV and set it to production to test error logging
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
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
      public testApplyFilters(shows: Show[], options: ShowOptions): Show[] {
        // Access the protected method using type assertion
        return this.applyFilters(shows, options);
      }
    }
    
    let testService: TestTvMazeService;
    let testShows: Show[];
    
    beforeEach(() => {
      testService = new TestTvMazeService(mockHttpClient);
      
      // Create test shows using the utility function
      testShows = createTestShows(5, (index: number) => {
        switch (index) {
        case 0:
          return {
            id: 1,
            name: 'Show 1',
            type: 'Scripted',
            genres: ['Drama'],
            language: 'English',
            network: 'ABC'
          };
        case 1:
          return {
            id: 2,
            name: 'Show 2',
            type: 'Reality',
            genres: ['Reality'],
            language: 'Spanish',
            network: 'CBS'
          };
        case 2:
          return {
            id: 3,
            name: 'Show 3',
            type: 'Variety',
            genres: ['Comedy', 'Talk Show'],
            language: 'French',
            network: 'Netflix'
          };
        case 3:
          return {
            id: 4,
            name: 'Show 4',
            type: 'Scripted',
            genres: ['Thriller'], // Change genre to Thriller
            language: 'English',
            network: 'HBO'
          };
        case 4:
          return {
            id: 5,
            name: 'Show 5',
            type: 'Documentary',
            genres: ['Documentary'],
            language: 'German',
            network: 'PBS'
          };
        default:
          return {};
        }
      });
    });
    
    it('returns all shows when no filters are applied', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
        types: [],
        genres: [],
        languages: [],
        networks: []
      });
      
      expect(result.length).toBe(5);
      result.forEach(show => {
        expectValidShow(show);
      });
    });
    
    it('applies type filter correctly', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
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
    
    it('applies minAirtime filter correctly', () => {
      // Create test shows with different airtimes
      const showsWithAirtimes = [
        { ...testShows[0], airtime: '20:00' }, // 8:00 PM
        { ...testShows[1], airtime: '15:30' }, // 3:30 PM
        { ...testShows[2], airtime: '19:00' }, // 7:00 PM
        { ...testShows[3], airtime: '' },      // No airtime (streaming)
        { ...testShows[4], airtime: '08:00' }  // 8:00 AM
      ];
      
      // Filter for shows that air at or after 18:00 (6:00 PM)
      const result = testService.testApplyFilters(showsWithAirtimes, {
        date: '',
        country: 'US',
        types: [],
        genres: [],
        languages: [],
        networks: [],
        minAirtime: '18:00'
      });
      
      // Should include 8:00 PM, 7:00 PM, and the streaming show with no airtime
      expect(result.length).toBe(3);
      
      // Verify the correct shows were included
      const airtimes = result.map(show => show.airtime).sort((a, b) => a.localeCompare(b));
      expect(airtimes).toEqual(['', '19:00', '20:00']);
    });
    
    it('handles minAirtime filter with empty airtime values', () => {
      // Create test shows with some missing airtimes
      const showsWithMissingAirtimes = [
        { ...testShows[0], airtime: '20:00' },     // 8:00 PM
        { ...testShows[1], airtime: null },        // Null airtime
        { ...testShows[2], airtime: null },        // Null airtime
        { ...testShows[3], airtime: '' },          // Empty string airtime
        { ...testShows[4], airtime: '08:00' }      // 8:00 AM
      ];
      
      // Filter for shows that air at or after 18:00 (6:00 PM)
      const result = testService.testApplyFilters(showsWithMissingAirtimes, {
        date: '',
        country: 'US',
        types: [],
        genres: [],
        languages: [],
        networks: [],
        minAirtime: '18:00'
      });
      
      // Should include 8:00 PM and all shows with null/empty airtimes
      expect(result.length).toBe(4);
      
      // Verify the 8:00 AM show was excluded
      expect(result.some(show => show.airtime === '08:00')).toBe(false);
    });
    
    it('handles case insensitive language matching', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
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
    
    it('handles multiple language filtering', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
        types: [],
        genres: [],
        languages: ['english', 'spanish'], // multiple languages
        networks: []
      });
      
      expect(result.length).toBe(3); // Should match shows with English or Spanish
      
      // Verify that all shows have either English or Spanish language
      const languages = result.map(show => show.language?.toLowerCase()).sort(
        (a, b) => (a ?? '').localeCompare(b ?? '')
      );
      expect(languages).toEqual(['english', 'english', 'spanish']);
    });
    
    it('properly handles null language values', () => {
      // Create test shows with null language
      const showsWithNullLanguage = [
        ...testShows,
        {
          ...testShows[0],
          id: 6,
          language: null
        }
      ];
      
      const result = testService.testApplyFilters(showsWithNullLanguage, {
        date: '',
        country: 'US',
        types: [],
        genres: [],
        languages: ['english'],
        networks: []
      });
      
      // Should only match shows with English language, not null
      expect(result.length).toBe(2);
      result.forEach(show => {
        expect(show.language?.toLowerCase()).toBe('english');
      });
    });
    
    it('applies multiple filters correctly', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
        types: ['Scripted'],
        genres: ['Drama'],
        languages: ['English'],
        networks: []
      });
      
      expect(result.length).toBe(1);
      expectValidShow(result[0]);
      expect(result[0].id).toBe(1);
      expect(result[0].type).toBe('Scripted');
      expect(result[0].genres).toContain('Drama');
      expect(result[0].language).toBe('English');
    });
    
    it('handles case insensitive type matching', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
        types: ['scripted'], // lowercase
        genres: [],
        languages: [],
        networks: []
      });
      
      expect(result.length).toBe(2);
      expect(result.every(show => show.type.toLowerCase() === 'scripted')).toBe(true);
    });
    
    it('handles case insensitive network matching with exact matching', () => {
      // Create a show with country code in network name
      const showsWithCountryCodes = [
        ...testShows,
        {
          ...testShows[0],
          id: 6,
          network: 'Hulu (JP)'
        },
        {
          ...testShows[0],
          id: 7,
          network: 'Hulu'
        }
      ];
      
      // Test exact matching with lowercase
      const result = testService.testApplyFilters(showsWithCountryCodes, {
        date: '',
        country: 'US',
        types: [],
        genres: [],
        languages: [],
        networks: ['netflix'] // lowercase
      });
      
      // Should match Netflix exactly (case insensitive)
      expect(result.length).toBe(1);
      expect(result[0].network).toBe('Netflix');
      
      // Test that country codes are removed for matching
      const huluResult = testService.testApplyFilters(showsWithCountryCodes, {
        date: '',
        country: 'US',
        types: [],
        genres: [],
        languages: [],
        networks: ['hulu'] // lowercase
      });
      
      // Should match both Hulu and Hulu (JP) since country codes are removed
      expect(huluResult.length).toBe(2);
      expect(huluResult.some(show => show.network === 'Hulu')).toBe(true);
      expect(huluResult.some(show => show.network === 'Hulu (JP)')).toBe(true);
    });
    
    it('handles case insensitive genre matching', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
        types: [],
        genres: ['comedy'], // lowercase
        languages: [],
        networks: []
      });

      expect(result.length).toBe(1);
      expect(result[0].genres).toContain('Comedy');
    });

    it('excludes shows by exact name', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
        types: [],
        genres: [],
        languages: [],
        networks: [],
        excludeShowNames: ['Show 1', 'Show 3']
      });

      expect(result.length).toBe(3);
      expect(result.some(show => show.name === 'Show 1')).toBe(false);
      expect(result.some(show => show.name === 'Show 3')).toBe(false);
      expect(result.some(show => show.name === 'Show 2')).toBe(true);
    });

    it('excludes shows by regex pattern', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
        types: [],
        genres: [],
        languages: [],
        networks: [],
        excludeShowNames: ['^Show [12]$'] // Matches Show 1 and Show 2
      });

      expect(result.length).toBe(3);
      expect(result.some(show => show.name === 'Show 1')).toBe(false);
      expect(result.some(show => show.name === 'Show 2')).toBe(false);
      expect(result.some(show => show.name === 'Show 3')).toBe(true);
    });

    it('handles case insensitive show name exclusion', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
        types: [],
        genres: [],
        languages: [],
        networks: [],
        excludeShowNames: ['SHOW 1'] // uppercase
      });

      expect(result.length).toBe(4);
      expect(result.some(show => show.name === 'Show 1')).toBe(false);
    });

    it('treats invalid regex as literal string', () => {
      // Create a show with special characters in the name that match an invalid regex pattern
      const showsWithSpecialChars = [
        ...testShows,
        {
          ...testShows[0],
          id: 6,
          name: 'Show (Test'
        }
      ];

      // Invalid regex (unmatched parenthesis) should be treated as literal
      const result = testService.testApplyFilters(showsWithSpecialChars, {
        date: '',
        country: 'US',
        types: [],
        genres: [],
        languages: [],
        networks: [],
        excludeShowNames: ['Show (Test'] // Unmatched paren is invalid regex
      });

      expect(result.length).toBe(5);
      expect(result.some(show => show.name === 'Show (Test')).toBe(false);
    });

    it('handles empty excludeShowNames array', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
        types: [],
        genres: [],
        languages: [],
        networks: [],
        excludeShowNames: []
      });

      expect(result.length).toBe(5);
    });

    it('handles undefined excludeShowNames', () => {
      const result = testService.testApplyFilters(testShows, {
        date: '',
        country: 'US',
        types: [],
        genres: [],
        languages: [],
        networks: []
        // excludeShowNames not provided
      });

      expect(result.length).toBe(5);
    });
  });
});
