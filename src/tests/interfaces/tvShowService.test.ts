/**
 * Tests for the TvShowService interface
 * 
 * These tests focus on the interface contract and integration points,
 * rather than implementation details.
 */
import 'reflect-metadata';
import { 
  describe, 
  it, 
  beforeEach, 
  afterEach, 
  expect,
  jest
} from '@jest/globals';
import { container } from 'tsyringe';

import type { TvShowService } from '../../interfaces/tvShowService.js';
import type { HttpClient } from '../../interfaces/httpClient.js';
import { TvMazeServiceImpl } from '../../implementations/tvMazeServiceImpl.js';
import { createMockHttpClient } from '../mocks/factories/httpClientFactory.js';
import { createMockTvShowService } from '../mocks/factories/tvShowServiceFactory.js';
import { groupShowsByNetwork } from '../../utils/showUtils.js';
import { Fixtures } from '../fixtures/index.js';
import type { Show } from '../../schemas/domain.js';
import { ShowBuilder } from '../fixtures/helpers/showFixtureBuilder.js';

// Load fixture data
const networkScheduleFixtures = Fixtures.tvMaze.getSchedule('network-schedule');
const webScheduleFixtures = Fixtures.tvMaze.getSchedule('web-schedule');

describe('TvShowService Interface', () => {
  let service: TvShowService;
  // Use type assertion to handle the mock type compatibility
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    // Reset container for each test
    container.clearInstances();
    
    // Create a mock HttpClient
    mockHttpClient = createMockHttpClient();
    
    // Register the mock HTTP client
    container.registerInstance<HttpClient>('HttpClient', mockHttpClient);
    
    // Create the service instance
    service = new TvMazeServiceImpl(mockHttpClient);
  });

  afterEach(() => {
    // Clean up after each test
    container.clearInstances();
  });

  describe('groupShowsByNetwork', () => {
    it('groups shows by network correctly', () => {
      // Create sample shows with different networks
      const shows: Show[] = [
        new ShowBuilder()
          .withId(1)
          .withName('CBS Show')
          .withNetwork('CBS')
          .withLanguage('English')
          .withType('Scripted')
          .withGenres(['Drama'])
          .withSummary('Test summary')
          .withAirtime('20:00')
          .withEpisode(1, 1)
          .build(),
        new ShowBuilder()
          .withId(2)
          .withName('NBC Show')
          .withNetwork('NBC')
          .withLanguage('English')
          .withType('Scripted')
          .withGenres(['Comedy'])
          .withSummary('Test summary')
          .withAirtime('21:00')
          .withEpisode(1, 2)
          .build(),
        new ShowBuilder()
          .withId(3)
          .withName('Another CBS Show')
          .withNetwork('CBS')
          .withLanguage('English')
          .withType('Scripted')
          .withGenres(['Drama'])
          .withSummary('Test summary')
          .withAirtime('22:00')
          .withEpisode(1, 3)
          .build()
      ];
      
      // Call the utility function
      const grouped = groupShowsByNetwork(shows);
      
      // Verify the result
      expect(grouped).toBeDefined();
      expect(hasNetwork(grouped, 'CBS')).toBe(true);
      expect(hasNetwork(grouped, 'NBC')).toBe(true);
      expect(getShowsCount(grouped, 'CBS')).toBe(2);
      expect(getShowsCount(grouped, 'NBC')).toBe(1);
    });
  });

  describe('fetchShows', () => {
    it('fetches network shows by default', async () => {
      // Mock the HTTP client to return network schedule data
      jest.spyOn(mockHttpClient, 'get').mockResolvedValue({
        data: networkScheduleFixtures,
        status: 200,
        headers: {}
      });
      
      // Call the method being tested
      const result = await service.fetchShows({});
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      
      // Verify the HTTP client was called with the correct URL pattern
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('schedule')
      );
    });

    it('fetches web shows when specified', async () => {
      // Mock the HTTP client to return web schedule data
      jest.spyOn(mockHttpClient, 'get').mockResolvedValue({
        data: webScheduleFixtures,
        status: 200,
        headers: {}
      });
      
      // Call the method being tested with web option
      const result = await service.fetchShows({ fetchSource: 'web' });
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      
      // Verify the HTTP client was called with the correct URL pattern
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('web')
      );
    });

    it('filters shows by network', async () => {
      // Create CBS shows for testing
      const cbsShows = [
        new ShowBuilder()
          .withId(101)
          .withName('CBS Show 1')
          .withNetwork('CBS')
          .withLanguage('English')
          .withType('Scripted')
          .withGenres(['Drama'])
          .withSummary('CBS show summary')
          .withAirtime('20:00')
          .withEpisode(1, 1)
          .build()
      ];
      
      // Create a mock TV show service with network-specific shows
      const mockService = createMockTvShowService({
        showsByNetwork: {
          'CBS': cbsShows
        }
      });
      
      // Call the method being tested with network filter
      const result = await mockService.fetchShows({ networks: ['CBS'] });
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      
      // All returned shows should be from CBS
      expect(result[0].network).toBe('CBS');
    });

    it('filters shows by language', async () => {
      // Create a mock TV show service with language-specific shows
      const mockService = createMockTvShowService({
        showsByLanguage: {
          'English': [
            new ShowBuilder()
              .withId(7001)
              .withName('English Show')
              .withNetwork('ABC')
              .withLanguage('English')
              .withType('Scripted')
              .withGenres(['Drama'])
              .withSummary('English show summary')
              .withAirtime('20:00')
              .withEpisode(1, 1)
              .build()
          ]
        }
      });
      
      // Call the method being tested with language filter
      const result = await mockService.fetchShows({ languages: ['English'] });
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].language).toBe('English');
    });
  });
});

// Helper functions for testing - use arrow functions to avoid 'this' scoping issues
const hasNetwork = (groups: Record<string, Show[]>, network: string): boolean => 
  Object.prototype.hasOwnProperty.call(groups, network);

const getShowsCount = (groups: Record<string, Show[]>, network: string): number => {
  if (hasNetwork(groups, network)) {
    return groups[network].length;
  }
  return 0;
};
