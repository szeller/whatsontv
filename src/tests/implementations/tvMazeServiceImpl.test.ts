/**
 * Tests for the TvMazeServiceImpl implementation
 */
import 'reflect-metadata';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { container } from 'tsyringe';

// Import the service to test
import { TvMazeServiceImpl } from '../../implementations/tvMazeServiceImpl.js';
import { HttpClient, HttpResponse } from '../../interfaces/httpClient.js';
import { Show } from '../../types/tvmaze.js';
import type { TVMazeShow } from '../../types/tvmaze.js';

// Create a mock implementation of HttpClient for testing
class MockHttpClient implements HttpClient {
  public getMock = jest.fn<
    (url: string, params?: Record<string, string>) => Promise<HttpResponse<unknown>>
  >();
  
  public postMock = jest.fn<
    (url: string, data?: unknown, params?: Record<string, string>) => Promise<HttpResponse<unknown>>
  >();

  async get<T>(url: string, params?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.getMock(url, params) as Promise<HttpResponse<T>>;
  }

  async post<T, D = unknown>(
    url: string, 
    data?: D, 
    params?: Record<string, string>
  ): Promise<HttpResponse<T>> {
    return this.postMock(url, data, params) as Promise<HttpResponse<T>>;
  }
}

describe('TvMazeServiceImpl', () => {
  // Mock HTTP client
  let mockHttpClient: MockHttpClient;
  let tvMazeService: TvMazeServiceImpl;
  let originalConsoleError: typeof console.error;
  
  // Create a mock show object with the structure expected by normalizeShowData
  const mockTvMazeShow: TVMazeShow = {
    id: 1,
    name: 'Test Show',
    type: 'Scripted',
    language: 'English',
    genres: ['Drama'],
    network: {
      id: 1,
      name: 'Test Network',
      country: {
        name: 'United States',
        code: 'US',
        timezone: 'America/New_York'
      }
    },
    webChannel: null,
    image: null,
    summary: 'Test summary',
    airtime: '20:00',
    // This is the key: normalizeShowData expects a show property
    show: {
      id: 1,
      name: 'Test Show',
      type: 'Scripted',
      language: 'English',
      genres: ['Drama'],
      network: {
        id: 1,
        name: 'Test Network',
        country: {
          name: 'United States',
          code: 'US',
          timezone: 'America/New_York'
        }
      },
      webChannel: null,
      image: null,
      summary: 'Test summary'
    }
  };
  
  // Sample show data for testing
  const mockShow: Show = {
    airtime: '20:00',
    name: 'Test Episode',
    season: 1,
    number: 1,
    show: {
      id: 1,
      name: 'Test Show',
      type: 'Scripted',
      language: 'English',
      genres: ['Drama'],
      network: {
        id: 1,
        name: 'Test Network',
        country: {
          name: 'United States',
          code: 'US',
          timezone: 'America/New_York'
        }
      },
      webChannel: null,
      image: null,
      summary: 'Test summary'
    }
  };

  const mockSearchResult = [{ 
    score: 0.9,
    show: mockTvMazeShow
  }];

  beforeEach(() => {
    // Save original console.error
    originalConsoleError = console.error;
    // Mock console.error to prevent test output noise
    console.error = jest.fn();
    
    // Reset container for each test
    container.clearInstances();
    
    // Create mock HTTP client
    mockHttpClient = new MockHttpClient();
    
    // Register mock HTTP client in the container
    container.registerInstance<HttpClient>('HttpClient', mockHttpClient);
    
    // Create the service instance
    tvMazeService = container.resolve(TvMazeServiceImpl);
  });
  
  afterEach(() => {
    // Restore original console.error
    console.error = originalConsoleError;
  });

  describe('getShowsByDate', () => {
    it('returns shows for a specific date', async () => {
      // Mock the HTTP response
      const mockResponse: HttpResponse<Show[]> = {
        data: [mockShow],
        status: 200,
        headers: {}
      };
      
      // Setup the mock to return our response
      mockHttpClient.getMock.mockResolvedValue(mockResponse);
      
      // Call the method
      const result = await tvMazeService.getShowsByDate('2025-03-20');
      
      // Verify the results
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockShow);
      
      // Verify the API was called correctly - check first argument only
      expect(mockHttpClient.getMock.mock.calls[0][0]).toBe(
        'https://api.tvmaze.com/schedule?date=2025-03-20&country=US'
      );
    });
    
    it('handles API errors gracefully', async () => {
      // Setup the mock to throw an error
      mockHttpClient.getMock.mockRejectedValue(new Error('Network Error: API Error'));
      
      // Call the method
      const result = await tvMazeService.getShowsByDate('2025-03-20');
      
      // Verify the results
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('searchShows', () => {
    it('searches for shows by query', async () => {
      // Mock the HTTP response with search results
      const mockResponse: HttpResponse<typeof mockSearchResult> = {
        data: mockSearchResult,
        status: 200,
        headers: {}
      };
      
      // Setup the mock
      mockHttpClient.getMock.mockResolvedValue(mockResponse);
      
      // Call the method
      const result = await tvMazeService.searchShows('test');
      
      // Verify the result
      expect(result).toHaveLength(1);
      
      // Verify the API was called with the correct URL - check first argument only
      expect(mockHttpClient.getMock.mock.calls[0][0]).toBe(
        'https://api.tvmaze.com/search/shows?q=test'
      );
    });
    
    it('handles API errors gracefully', async () => {
      // Setup the mock to throw an error
      mockHttpClient.getMock.mockRejectedValue(new Error('API Error'));
      
      // Call the method
      const result = await tvMazeService.searchShows('test');
      
      // Verify the result is an empty array
      expect(result).toEqual([]);
      
      // Verify the error was logged
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getShows', () => {
    it('calls searchShows when search option is provided', async () => {
      // Setup spy on searchShows
      const searchShowsSpy = jest.spyOn(tvMazeService, 'searchShows');
      
      // Mock the HTTP response
      const mockResponse: HttpResponse<typeof mockSearchResult> = {
        data: mockSearchResult,
        status: 200,
        headers: {}
      };
      
      // Setup the mock
      mockHttpClient.getMock.mockResolvedValue(mockResponse);
      
      // Call the method with search option
      await tvMazeService.getShows({ search: 'test' });
      
      // Verify searchShows was called with the correct parameter
      expect(searchShowsSpy).toHaveBeenCalledWith('test');
    });
    
    it('calls fetchShowsWithOptions when no search option is provided', async () => {
      // Mock the HTTP response
      const mockResponse: HttpResponse<Show[]> = {
        data: [mockShow],
        status: 200,
        headers: {}
      };
      
      // Setup the mock
      mockHttpClient.getMock.mockResolvedValue(mockResponse);
      
      // Call the method without search option but with date
      const result = await tvMazeService.getShows({ date: '2025-03-20' });
      
      // Verify the API was called with the correct URL
      expect(mockHttpClient.getMock.mock.calls[0][0]).toBe(
        'https://api.tvmaze.com/schedule?date=2025-03-20&country=US'
      );
      
      // Verify the results
      expect(result).toHaveLength(1);
    });
  });
});
