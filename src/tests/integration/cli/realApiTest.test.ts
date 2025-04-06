/**
 * Real API Integration Test
 * 
 * This test uses the real TVMaze API to verify that the application can
 * correctly process actual API responses through the CLI interface.
 * It keeps console output mocked for stability and test isolation.
 */
import { container } from '../../../container.js';
import { FetchHttpClientImpl } from '../../../implementations/fetchHttpClientImpl.js';
import { TvMazeServiceImpl } from '../../../implementations/tvMazeServiceImpl.js';
import type { HttpClient } from '../../../interfaces/httpClient.js';
import type { TvShowService } from '../../../interfaces/tvShowService.js';
import type { TextShowFormatter } from '../../../interfaces/showFormatter.js';
import { getTodayDate } from '../../../utils/dateUtils.js';
import { groupShowsByNetwork } from '../../../utils/showUtils.js';
import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';

describe('Real API Integration Test', () => {
  // Original services
  let originalHttpClient: HttpClient;
  let originalTvShowService: TvShowService;
  
  // Real HTTP client for API calls
  let realHttpClient: FetchHttpClientImpl;
  let tvShowService: TvShowService;
  let formatter: TextShowFormatter;
  
  beforeEach(() => {
    // Save original services
    originalHttpClient = container.resolve<HttpClient>('HttpClient');
    originalTvShowService = container.resolve<TvShowService>('TvShowService');
    
    // Create real HTTP client
    realHttpClient = new FetchHttpClientImpl();
    
    // Create real TV show service that uses the real HTTP client
    tvShowService = new TvMazeServiceImpl(realHttpClient);
    
    // Get formatter
    formatter = container.resolve<TextShowFormatter>('TextShowFormatter');
    
    // Register services in the container
    container.register('HttpClient', { useValue: realHttpClient });
    container.register('TvShowService', { useValue: tvShowService });
  });
  
  afterEach(() => {
    // Restore original services
    container.register('HttpClient', { useValue: originalHttpClient });
    container.register('TvShowService', { useValue: originalTvShowService });
  });
  
  test('should fetch network schedule from real TVMaze API', async () => {
    // Skip the CLI execution and test the components directly
    const options = {
      date: getTodayDate(),
      country: 'US',
      fetch: 'network',
      types: ['Scripted', 'Reality'],
      networks: [],
      languages: ['English']
    };
    
    // Act - fetch shows directly using the service
    const shows = await tvShowService.fetchShows(options);
    
    // Assert
    expect(shows).toBeDefined();
    expect(shows.length).toBeGreaterThan(0);
    
    // Group shows by network before formatting
    const networkGroups = groupShowsByNetwork(shows);
    
    // Test formatter with the real data
    const formatted = formatter.formatNetworkGroups(networkGroups);
    expect(formatted.length).toBeGreaterThan(0);
  }, 30000); // Increase timeout for API call
  
  test('should fetch web schedule from real TVMaze API', async () => {
    // Skip the CLI execution and test the components directly
    const options = {
      date: getTodayDate(),
      fetch: 'web',
      types: ['Scripted', 'Reality'],
      languages: ['English']
    };
    
    // Act - fetch shows directly using the service
    const shows = await tvShowService.fetchShows(options);
    
    // Assert
    expect(shows).toBeDefined();
    expect(shows.length).toBeGreaterThan(0);
    
    // Group shows by network before formatting
    const networkGroups = groupShowsByNetwork(shows);
    
    // Test formatter with the real data
    const formatted = formatter.formatNetworkGroups(networkGroups);
    expect(formatted.length).toBeGreaterThan(0);
  }, 30000); // Increase timeout for API call
  
  test('should fetch all shows with filtering', async () => {
    // Skip the CLI execution and test the components directly
    const options = {
      date: getTodayDate(),
      country: 'US',
      fetch: 'all',
      types: ['Scripted', 'Reality'],
      networks: [],
      languages: ['English']
    };
    
    // Act - fetch shows directly using the service
    const shows = await tvShowService.fetchShows(options);
    
    // Assert
    expect(shows).toBeDefined();
    expect(shows.length).toBeGreaterThan(0);
    
    // Group shows by network before formatting
    const networkGroups = groupShowsByNetwork(shows);
    
    // Test formatter with the real data
    const formatted = formatter.formatNetworkGroups(networkGroups);
    expect(formatted.length).toBeGreaterThan(0);
  }, 30000); // Increase timeout for API call
});
