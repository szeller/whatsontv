/**
 * Tests for the TvMazeServiceImpl implementation
 */
import 'reflect-metadata';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { container } from 'tsyringe';
import { TvMazeServiceImpl } from '../../implementations/tvMazeServiceImpl.js';
import type { HttpClient, HttpResponse } from '../../interfaces/httpClient.js';
import type { Show } from '../../types/tvShowModel.js';
import { TvMazeFixtures } from '../fixtures/tvmaze/tvMazeFixtures.js';

/**
 * Create a mock implementation of HttpClient for testing
 */
class MockHttpClient implements HttpClient {
  public getMock = jest.fn<
    (url: string, params?: Record<string, string>) => Promise<HttpResponse<unknown>>
  >();
  public postMock = jest.fn<
    (
      url: string, 
      data?: unknown, 
      params?: Record<string, string>
    ) => Promise<HttpResponse<unknown>>
  >();

  public lastUrl = '';

  async get<T>(
    url: string, 
    params?: Record<string, string>
  ): Promise<HttpResponse<T>> {
    this.lastUrl = url;
    return this.getMock(url, params) as Promise<HttpResponse<T>>;
  }

  async post<T>(
    url: string, 
    data?: unknown, 
    params?: Record<string, string>
  ): Promise<HttpResponse<T>> {
    return this.postMock(url, data, params) as Promise<HttpResponse<T>>;
  }

  mockGet(url: string, response: HttpResponse<unknown>): void {
    this.getMock.mockResolvedValue(response);
  }
}

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
      isStreaming: false,
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
      mockHttpClient.mockGet('https://api.tvmaze.com/schedule?date=2023-01-01&country=US', {
        data: TvMazeFixtures.getNetworkSchedule(),
        status: 200,
        headers: {}
      });

      const result = await tvMazeService.fetchShows({ date: '2023-01-01' });
      expect(result.length).toBeGreaterThan(0);
    });

    it('fetches shows for today', async () => {
      // Mock the HTTP client for this specific endpoint
      const todayDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      mockHttpClient.mockGet(`https://api.tvmaze.com/schedule?date=${todayDate}&country=US`, {
        data: TvMazeFixtures.getNetworkSchedule(),
        status: 200,
        headers: {}
      });

      const result = await tvMazeService.fetchShows({ date: todayDate });
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles empty responses', async () => {
      // Mock empty response
      mockHttpClient.mockGet('https://api.tvmaze.com/schedule?date=2099-01-01&country=US', {
        data: [],
        status: 200,
        headers: {}
      });

      const result = await tvMazeService.fetchShows({ date: '2099-01-01' });
      expect(result).toHaveLength(0);
    });

    it('applies multiple filters', async () => {
      // Mock the HTTP client
      mockHttpClient.mockGet('https://api.tvmaze.com/schedule?date=2025-03-25&country=US', {
        data: TvMazeFixtures.getNetworkSchedule(),
        status: 200,
        headers: {}
      });

      // First, let's log the available types, networks, genres in our test data
      const networkData = TvMazeFixtures.getNetworkSchedule();
      const shows = networkData
        .map(item => item.show)
        .filter((show): show is { 
          type?: string; 
          network?: { name?: string }; 
          genres?: string[] 
        } => show !== undefined && show !== null);
      
      // Get unique types, networks, genres from our test data
      const types = [...new Set(shows
        .map(show => show.type)
        .filter((type): type is string => type !== undefined && type !== null))];
        
      const networks = [...new Set(shows
        .map(show => show.network?.name)
        .filter((name): name is string => name !== undefined && name !== null))];
        
      const genres = [...new Set(shows
        .flatMap(show => show.genres || [])
        .filter((genre): genre is string => genre !== undefined && genre !== null))];
      
      console.log('Available types in test data:', types);
      console.log('Available networks in test data:', networks);
      console.log('Available genres in test data:', genres);
      
      // Use values that exist in our test data
      const result = await tvMazeService.fetchShows({
        types: types.length > 0 ? [types[0]] : undefined,
        networks: networks.length > 0 ? [networks[0]] : undefined,
        genres: genres.length > 0 ? [genres[0]] : undefined,
        languages: ['English']
      });

      expect(result.length).toBeGreaterThan(0);
    });
    
    it('fetches web-only shows', async () => {
      // Mock the web schedule endpoint
      const todayDate = new Date().toISOString().split('T')[0];
      mockHttpClient.mockGet(`https://api.tvmaze.com/schedule/web?date=${todayDate}`, {
        data: TvMazeFixtures.getWebSchedule(),
        status: 200,
        headers: {}
      });
      
      const result = await tvMazeService.fetchShows({ webOnly: true });
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].isStreaming).toBe(true);
    });
    
    it('fetches both network and web shows when showAll is true', async () => {
      // Mock both endpoints
      const todayDate = new Date().toISOString().split('T')[0];
      mockHttpClient.mockGet(`https://api.tvmaze.com/schedule?date=${todayDate}&country=US`, {
        data: TvMazeFixtures.getNetworkSchedule(),
        status: 200,
        headers: {}
      });
      
      mockHttpClient.mockGet(`https://api.tvmaze.com/schedule/web?date=${todayDate}`, {
        data: TvMazeFixtures.getWebSchedule(),
        status: 200,
        headers: {}
      });
      
      const result = await tvMazeService.fetchShows({ showAll: true });
      
      expect(result.length).toBeGreaterThan(0);
      // Verify we have both types of shows
      const networkShowsCount = result.filter(show => !show.isStreaming).length;
      const webShowsCount = result.filter(show => show.isStreaming).length;
      expect(networkShowsCount).toBeGreaterThan(0);
      expect(webShowsCount).toBeGreaterThan(0);
    });
  });
});
