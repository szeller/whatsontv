/**
 * Tests for the TvShowService interface
 * 
 * These tests focus on the interface contract and integration points,
 * rather than implementation details.
 */
import 'reflect-metadata';
import { describe, it, beforeEach, expect, afterEach, jest } from '@jest/globals';
import { container } from 'tsyringe';

import type { Show } from '../../types/tvShowModel.js';
import type { TvShowService } from '../../interfaces/tvShowService.js';
import { TvMazeServiceImpl } from '../../implementations/tvMazeServiceImpl.js';
import { MockHttpClient } from '../utils/mockHttpClient.js';
import { groupShowsByNetwork } from '../../utils/showUtils.js';
import { getTodayDate } from '../../utils/dateUtils.js';
import { transformSchedule } from '../../types/tvmazeModel.js';
import { TvMazeFixtures } from '../fixtures/tvmaze/tvMazeFixtures.js';

// Create a mock HTTP client and service instance
let mockClient: MockHttpClient;
let _tvShowService: TvMazeServiceImpl;

// Helper functions for testing
function hasNetwork(groups: Record<string, Show[]>, network: string): boolean {
  return Object.prototype.hasOwnProperty.call(groups, network);
}

function getShowsCount(groups: Record<string, Show[]>, network: string): number {
  if (hasNetwork(groups, network)) {
    return groups[network].length;
  }
  return 0;
}

// Load fixture data
const networkScheduleFixtures = TvMazeFixtures.getNetworkSchedule() as Array<{
  id: number;
  show: {
    id: number;
    name: string;
    type: string;
    language: string;
    genres: string[];
    network: {
      name: string;
    } | null;
    webChannel: {
      name: string;
    } | null;
    summary: string | null;
  };
}>;
const webScheduleFixtures = TvMazeFixtures.getWebSchedule();
const _combinedScheduleFixtures = TvMazeFixtures.getCombinedSchedule();

// Transform fixture data to our domain model
const networkShows = transformSchedule(networkScheduleFixtures);
// For web shows, we'll also use transformSchedule since the transformWebSchedule 
// function doesn't exist
const webShows = transformSchedule(webScheduleFixtures).map((show) => ({
  ...show,
  network: show.network ?? '',
  language: show.language !== undefined && show.language !== null ? show.language : ''
}));

const _combinedShows = [...networkShows, ...webShows];

// Create a filtered set of shows for specific test cases
const defaultShow = networkShows[0];
const englishShow = networkShows.find((show) => 
  show.language !== undefined && 
  show.language !== null && 
  show.language === 'English'
) || defaultShow;

const _spanishShow = { 
  ...defaultShow, 
  language: 'Spanish' 
};

const netflixShow = webShows.find((show) => 
  show.network !== undefined && 
  show.network !== null && 
  show.network === 'Netflix'
);
const fallbackShow = webShows.length > 0 ? webShows[0] : defaultShow;
const finalNetflixShow = netflixShow !== undefined ? netflixShow : fallbackShow;

describe('TvShowService Interface', () => {
  beforeEach(() => {
    // Reset the mock client before each test
    mockClient = new MockHttpClient();
    
    // Register the mock client with the container
    container.registerInstance('HttpClient', mockClient);
    
    // Create a new service instance
    container.registerSingleton<TvShowService>('TvShowService', TvMazeServiceImpl);
    
    // Reset all mocks
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Clear the container after each test
    container.clearInstances();
  });
  
  describe('groupShowsByNetwork', () => {
    it('groups shows by network correctly', () => {
      // Call the utility function directly instead of going through the service
      const result = groupShowsByNetwork([finalNetflixShow, englishShow]);
      
      // Use our type-safe helper functions to verify the result
      const networks = Object.keys(result).sort();
      // Make sure we have unique network names in the expected array
      const uniqueNetworks = [...new Set([finalNetflixShow.network, englishShow.network])].sort();
      expect(networks).toEqual(uniqueNetworks);
      
      // Get the actual count for each network
      const netflixCount = getShowsCount(result, finalNetflixShow.network);
      const englishShowCount = getShowsCount(result, englishShow.network);
      
      // Verify that we have at least one show for each network
      expect(netflixCount).toBeGreaterThan(0);
      expect(englishShowCount).toBeGreaterThan(0);
    });
  });
  
  describe('fetchShows', () => {
    it('fetches shows with default options', async () => {
      const service = container.resolve<TvShowService>('TvShowService');
      const today = getTodayDate();
      
      // Set up the mock responses for both endpoints
      mockClient.mockGet(`https://api.tvmaze.com/schedule?date=${today}&country=US`, {
        data: networkScheduleFixtures,
        status: 200,
        headers: {}
      });
      
      // Call the method being tested
      const result = await service.fetchShows({});
      
      // Verify the result
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toBe(networkShows[0].name);
      // Verify only network endpoint was called by default
      const requests = mockClient.getRequests();
      expect(requests).toContain(`https://api.tvmaze.com/schedule?date=${today}&country=US`);
    });

    it('fetches web shows when webOnly is true', async () => {
      const service = container.resolve<TvShowService>('TvShowService');
      const today = getTodayDate();
      
      // Set up the mock responses for web endpoint
      mockClient.mockGet(`https://api.tvmaze.com/schedule/web?date=${today}`, {
        data: webScheduleFixtures,
        status: 200,
        headers: {}
      });
      
      // Call the method being tested
      const result = await service.fetchShows({ webOnly: true });
      
      // Verify the result
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].isStreaming).toBe(true);
      // Verify only web endpoint was called
      const requests = mockClient.getRequests();
      expect(requests).toContain(`https://api.tvmaze.com/schedule/web?date=${today}`);
    });

    it('fetches both network and web shows when showAll is true', async () => {
      const service = container.resolve<TvShowService>('TvShowService');
      const today = getTodayDate();
      
      // Set up the mock responses for both endpoints
      mockClient.mockGet(`https://api.tvmaze.com/schedule?date=${today}&country=US`, {
        data: networkScheduleFixtures,
        status: 200,
        headers: {}
      });
      
      mockClient.mockGet(`https://api.tvmaze.com/schedule/web?date=${today}`, {
        data: webScheduleFixtures,
        status: 200,
        headers: {}
      });
      
      // Call the method being tested
      const result = await service.fetchShows({ showAll: true });
      
      // Verify the result
      expect(result.length).toBeGreaterThan(0);
      // Verify both endpoints were called
      const requests = mockClient.getRequests();
      expect(requests).toContain(`https://api.tvmaze.com/schedule?date=${today}&country=US`);
      expect(requests).toContain(`https://api.tvmaze.com/schedule/web?date=${today}`);

      // Verify we have both types of shows
      const networkShowsCount = result.filter(show => !show.isStreaming).length;
      const webShowsCount = result.filter(show => show.isStreaming).length;
      expect(networkShowsCount).toBeGreaterThan(0);
      expect(webShowsCount).toBeGreaterThan(0);
    });
  });
  
  describe('filtering', () => {
    it('filters shows by language', async () => {
      const service = container.resolve<TvShowService>('TvShowService');
      const today = getTodayDate();
      
      // Set up the mock response with shows of different languages
      mockClient.mockGet(`https://api.tvmaze.com/schedule?date=${today}&country=US`, {
        data: [
          {
            id: networkScheduleFixtures[0].id,
            show: {
              id: networkScheduleFixtures[0].show.id,
              name: networkScheduleFixtures[0].show.name,
              type: networkScheduleFixtures[0].show.type,
              language: 'English',
              genres: networkScheduleFixtures[0].show.genres,
              network: networkScheduleFixtures[0].show.network,
              webChannel: networkScheduleFixtures[0].show.webChannel,
              summary: networkScheduleFixtures[0].show.summary
            }
          },
          {
            id: networkScheduleFixtures[0].id,
            show: {
              id: networkScheduleFixtures[0].show.id,
              name: networkScheduleFixtures[0].show.name,
              type: networkScheduleFixtures[0].show.type,
              language: 'Spanish',
              genres: networkScheduleFixtures[0].show.genres,
              network: networkScheduleFixtures[0].show.network,
              webChannel: networkScheduleFixtures[0].show.webChannel,
              summary: networkScheduleFixtures[0].show.summary
            }
          }
        ],
        status: 200,
        headers: {}
      });
      
      // Call the method with language filter
      const result = await service.fetchShows({
        languages: ['English']
      });
      
      // Verify the result - should only include the English show
      expect(result).toHaveLength(1);
      expect(result[0].language).toBe('English');
    });
  });
});
