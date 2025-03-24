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
const networkScheduleFixtures = TvMazeFixtures.getNetworkSchedule();
const webScheduleFixtures = TvMazeFixtures.getWebSchedule();
const _combinedScheduleFixtures = TvMazeFixtures.getCombinedSchedule();

// Transform fixture data to our domain model
const networkShows = transformSchedule(networkScheduleFixtures);
// For web shows, we'll also use transformSchedule since the transformWebSchedule 
// function doesn't exist
const webShows = transformSchedule(webScheduleFixtures).map((show) => ({
  ...show,
  channel: show.channel !== undefined && show.channel !== null ? show.channel : '',
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
  show.channel !== undefined && 
  show.channel !== null && 
  show.channel === 'Netflix'
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
      expect(networks).toEqual([finalNetflixShow.channel, englishShow.channel].sort());
      expect(getShowsCount(result, finalNetflixShow.channel)).toBe(1);
      expect(getShowsCount(result, englishShow.channel)).toBe(1);
    });
  });
  
  describe('fetchShowsWithOptions', () => {
    it('fetches shows with default options', async () => {
      const service = container.resolve<TvShowService>('TvShowService');
      const today = getTodayDate();
      
      // Set up the mock response for the HTTP client
      mockClient.mockGet(`https://api.tvmaze.com/schedule?date=${today}&country=US`, {
        data: networkScheduleFixtures,
        status: 200,
        headers: {}
      });
      
      // Call the method being tested
      const result = await service.fetchShowsWithOptions({});
      
      // Verify the result
      expect(result).toHaveLength(networkScheduleFixtures.length);
      expect(result[0].name).toBe(networkShows[0].name);
      expect(mockClient.lastUrl).toContain('schedule?date=');
    });
  });
  
  describe('filtering', () => {
    it('filters shows by language', async () => {
      const service = container.resolve<TvShowService>('TvShowService');
      
      // Create test shows with specific languages
      const englishShow = {
        ...defaultShow,
        language: 'English'
      };
      
      const spanishShow = {
        ...defaultShow,
        language: 'Spanish'
      };
      
      // Create a test dataset with both shows
      const testShows = [englishShow, spanishShow];
      
      // Mock the getShowsByDate method to return our test data
      jest.spyOn(service, 'getShowsByDate').mockResolvedValue(testShows);
      
      // Call the method with language filter
      const result = await service.fetchShowsWithOptions({
        languages: ['English']
      });
      
      // Verify the result - should only include the English show
      expect(result).toHaveLength(1);
      expect(result[0].language).toBe('English');
    });
    
    it('filters shows by network', async () => {
      const service = container.resolve<TvShowService>('TvShowService');
      
      // Create test shows with specific channels
      const netflixShow = {
        ...defaultShow,
        channel: 'Netflix'
      };
      
      const cbsShow = {
        ...defaultShow,
        channel: 'CBS'
      };
      
      // Create a test dataset with both shows
      const testShows = [netflixShow, cbsShow];
      
      // Mock the getShowsByDate method to return our test data
      jest.spyOn(service, 'getShowsByDate').mockResolvedValue(testShows);
      
      // Call the method with network filter
      const result = await service.fetchShowsWithOptions({
        networks: ['Netflix']
      });
      
      // Verify the result - should only include the Netflix show
      expect(result).toHaveLength(1);
      expect(result[0].channel).toBe('Netflix');
    });
  });
});
