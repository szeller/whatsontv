/**
 * Tests for the TvMazeService implementation
 */
import 'reflect-metadata';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { container } from 'tsyringe';

// Import the service to test
import { TvMazeService } from '../../services/tvMazeService.js';
import type { HttpClient, HttpResponse } from '../../utils/httpClient.js';
import type { Show, ShowDetails } from '../../types/tvmaze.js';

describe('TvMazeService', () => {
  // Mock HTTP client
  let mockHttpClient: jest.Mocked<HttpClient>;
  let tvMazeService: TvMazeService;
  let originalConsoleError: typeof console.error;
  
  // Sample show data for testing
  const mockShow: Show = {
    name: 'Test Episode',
    season: 1,
    number: 1,
    airtime: '20:00',
    show: {
      id: 1,
      name: 'Test Show',
      type: 'Scripted',
      language: 'English',
      genres: ['Drama'],
      network: {
        id: 1,
        name: 'Test Network',
        country: null
      },
      webChannel: null,
      image: null,
      summary: 'Test summary'
    }
  };

  beforeEach(() => {
    // Save original console.error
    originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Create a properly typed mock HTTP client
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn()
    } as jest.Mocked<HttpClient>;
    
    // Register the mock client in the container
    container.register<HttpClient>('HttpClient', {
      useValue: mockHttpClient
    });
    
    // Create service instance
    tvMazeService = container.resolve(TvMazeService);
  });

  afterEach(() => {
    // Restore original console.error
    console.error = originalConsoleError;
    
    // Clear container
    container.clearInstances();
  });

  describe('getShowsByDate', () => {
    it('fetches shows for today by default', async () => {
      // Setup mock response
      const mockResponse: HttpResponse<Show[]> = {
        data: [mockShow],
        status: 200,
        headers: {}
      };
      
      // Setup the mock to return our response
      mockHttpClient.get.mockResolvedValue(mockResponse);
      
      // Call the method
      const result = await tvMazeService.getShowsByDate('2025-03-20');
      
      // Verify the result
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockShow);
      
      // Verify the API was called with the correct URL
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        'https://api.tvmaze.com/schedule?date=2025-03-20'
      );
    });
    
    it('handles API errors gracefully', async () => {
      // Setup the mock to throw an error
      mockHttpClient.get.mockRejectedValue(new Error('API Error'));
      
      // Call the method
      const result = await tvMazeService.getShowsByDate('2025-03-20');
      
      // Verify the result is an empty array
      expect(result).toEqual([]);
      
      // Verify the error was logged
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getShowDetails', () => {
    it('fetches a specific show by ID', async () => {
      // Mock the HTTP response
      const mockShowDetails: ShowDetails = mockShow.show;
      const mockResponse: HttpResponse<ShowDetails> = {
        data: mockShowDetails,
        status: 200,
        headers: {}
      };
      
      // Setup the mock
      mockHttpClient.get.mockResolvedValue(mockResponse);
      
      // Call the method
      const result = await tvMazeService.getShowDetails(1);
      
      // Verify the result
      expect(result).not.toBeNull();
      
      // Verify the API was called with the correct URL
      expect(mockHttpClient.get).toHaveBeenCalledWith('https://api.tvmaze.com/shows/1');
    });
    
    it('handles API errors gracefully', async () => {
      // Setup the mock to throw an error
      mockHttpClient.get.mockRejectedValue(new Error('API Error'));
      
      // Call the method
      const result = await tvMazeService.getShowDetails(1);
      
      // Verify the result is null
      expect(result).toBeNull();
      
      // Verify the error was logged
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('searchShows', () => {
    it('searches for shows by query', async () => {
      // Mock the HTTP response
      const mockSearchResult = [{ show: mockShow.show }];
      const mockResponse: HttpResponse<{ show: ShowDetails }[]> = {
        data: mockSearchResult,
        status: 200,
        headers: {}
      };
      
      // Setup the mock
      mockHttpClient.get.mockResolvedValue(mockResponse);
      
      // Call the method
      const result = await tvMazeService.searchShows('test');
      
      // Verify the result
      expect(result).toHaveLength(1);
      
      // Verify the API was called with the correct URL
      expect(mockHttpClient.get).toHaveBeenCalledWith('https://api.tvmaze.com/search/shows?q=test');
    });
    
    it('handles API errors gracefully', async () => {
      // Setup the mock to throw an error
      mockHttpClient.get.mockRejectedValue(new Error('API Error'));
      
      // Call the method
      const result = await tvMazeService.searchShows('test');
      
      // Verify the result is an empty array
      expect(result).toEqual([]);
      
      // Verify the error was logged
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('getEpisodes', () => {
    it('fetches episodes for a specific show', async () => {
      // Mock the HTTP response
      const mockResponse: HttpResponse<Show[]> = {
        data: [mockShow],
        status: 200,
        headers: {}
      };
      
      // Setup the mock
      mockHttpClient.get.mockResolvedValue(mockResponse);
      
      // Call the method
      const result = await tvMazeService.getEpisodes(1);
      
      // Verify the result
      expect(result).toHaveLength(1);
      
      // Verify the API was called with the correct URL
      expect(mockHttpClient.get).toHaveBeenCalledWith('https://api.tvmaze.com/shows/1/episodes');
    });
    
    it('handles API errors gracefully', async () => {
      // Setup the mock to throw an error
      mockHttpClient.get.mockRejectedValue(new Error('API Error'));
      
      // Call the method
      const result = await tvMazeService.getEpisodes(1);
      
      // Verify the result is an empty array
      expect(result).toEqual([]);
      
      // Verify the error was logged
      expect(console.error).toHaveBeenCalled();
    });
  });
});
