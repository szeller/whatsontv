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
      channel: 'CBS',
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
  
  describe('getShowsByDate', () => {
    it('returns shows for a specific date', async () => {
      // Mock the HTTP client for this specific endpoint
      mockHttpClient.mockGet('https://api.tvmaze.com/schedule?date=2023-01-01&country=US', {
        data: TvMazeFixtures.getNetworkSchedule(),
        status: 200,
        headers: {}
      });

      const result = await tvMazeService.getShowsByDate('2023-01-01');
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

      const result = await tvMazeService.getShowsByDate(todayDate);
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles empty responses', async () => {
      // Mock empty response
      mockHttpClient.mockGet('https://api.tvmaze.com/schedule?date=2099-01-01&country=US', {
        data: [],
        status: 200,
        headers: {}
      });

      const result = await tvMazeService.getShowsByDate('2099-01-01');
      expect(result).toHaveLength(0);
    });
  });

  describe('fetchShowsWithOptions', () => {
    it('fetches shows with filtering options', async () => {
      // Mock the HTTP client for this specific endpoint
      const todayDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      mockHttpClient.mockGet(`https://api.tvmaze.com/schedule?date=${todayDate}&country=US`, {
        data: TvMazeFixtures.getNetworkSchedule(),
        status: 200,
        headers: {}
      });

      const result = await tvMazeService.fetchShowsWithOptions({
        types: ['Scripted'],
        networks: ['CBS'],
        genres: ['Drama'],
        languages: ['English']
      });

      expect(result.length).toBeGreaterThan(0);
    });
  });
});
