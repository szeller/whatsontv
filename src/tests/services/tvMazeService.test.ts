/**
 * Tests for the TvMazeServiceImpl implementation
 */
import 'reflect-metadata';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { container } from 'tsyringe';

// Import the service to test
import { TvMazeServiceImpl } from '../../implementations/tvMazeServiceImpl.js';
import type { HttpClient, HttpResponse } from '../../interfaces/httpClient.js';
import type { Show, ShowDetails } from '../../types/tvmaze.js';

describe('TvMazeServiceImpl', () => {
  // Mock HTTP client
  let mockHttpClient: jest.Mocked<HttpClient>;
  let tvMazeService: TvMazeServiceImpl;
  let originalConsoleError: typeof console.error;
  
  // Create a mock show object with the structure expected by normalizeShowData
  const mockTvMazeShow = {
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
    season: 1,
    number: 1,
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

  const mockSearchResult = [{ 
    score: 0.9,
    show: mockTvMazeShow
  }];

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
    tvMazeService = container.resolve(TvMazeServiceImpl);
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
        data: [mockTvMazeShow],
        status: 200,
        headers: {}
      };
      
      // Setup the mock to return our response
      mockHttpClient.get.mockResolvedValue(mockResponse);
      
      // Call the method
      const result = await tvMazeService.getShowsByDate('2025-03-20');
      
      // Verify the result
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(mockTvMazeShow.name);
      expect(result[0].season).toBe(mockTvMazeShow.season);
      expect(result[0].number).toBe(mockTvMazeShow.number);
      expect(result[0].show.id).toBe(mockTvMazeShow.show.id);
      
      // Verify the API was called with the correct URL
      const { calls } = mockHttpClient.get.mock;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toContain('https://api.tvmaze.com/schedule');
    });
    
    it('handles API errors gracefully', async () => {
      // Setup the mock to throw an error
      mockHttpClient.get.mockRejectedValue(new Error('API Error'));
      
      // Call the method
      const result = await tvMazeService.getShowsByDate('2025-03-20');
      
      // Verify the result is an empty array
      expect(result).toEqual([]);
      
      // Verify the error was logged
      const { calls } = (console.error as jest.Mock).mock;
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  describe('getShowDetails', () => {
    it('fetches a specific show by ID', async () => {
      // Mock the HTTP response
      const mockResponse: HttpResponse<ShowDetails> = {
        data: mockTvMazeShow.show,
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
      const { calls } = mockHttpClient.get.mock;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toContain('https://api.tvmaze.com/shows/1');
    });
    
    it('handles API errors gracefully', async () => {
      // Setup the mock to throw an error
      mockHttpClient.get.mockRejectedValue(new Error('API Error'));
      
      // Call the method
      const result = await tvMazeService.getShowDetails(1);
      
      // Verify the result is null
      expect(result).toBeNull();
      
      // Verify the error was logged
      const { calls } = (console.error as jest.Mock).mock;
      expect(calls.length).toBeGreaterThan(0);
    });
  });
  
  describe('searchShows', () => {
    it('searches for shows by query', async () => {
      // Mock the HTTP response
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
      const { calls } = mockHttpClient.get.mock;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toContain('https://api.tvmaze.com/search/shows');
    });
    
    it('handles API errors gracefully', async () => {
      // Setup the mock to throw an error
      mockHttpClient.get.mockRejectedValue(new Error('API Error'));
      
      // Call the method
      const result = await tvMazeService.searchShows('test');
      
      // Verify the result is an empty array
      expect(result).toEqual([]);
      
      // Verify the error was logged
      const { calls } = (console.error as jest.Mock).mock;
      expect(calls.length).toBeGreaterThan(0);
    });
  });
  
  describe('getEpisodes', () => {
    it('fetches episodes for a specific show', async () => {
      // Mock the HTTP response
      const mockResponse: HttpResponse<Show[]> = {
        data: [mockTvMazeShow],
        status: 200,
        headers: {}
      };
      
      // Setup the mock
      mockHttpClient.get.mockResolvedValue(mockResponse);
      
      // Call the method
      const result = await tvMazeService.getEpisodes(1);
      
      // Verify the result
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(mockTvMazeShow.name);
      expect(result[0].season).toBe(mockTvMazeShow.season);
      expect(result[0].number).toBe(mockTvMazeShow.number);
      expect(result[0].show.id).toBe(mockTvMazeShow.show.id);
      
      // Verify the API was called with the correct URL
      const { calls } = mockHttpClient.get.mock;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toContain('https://api.tvmaze.com/shows/1/episodes');
    });
    
    it('handles API errors gracefully', async () => {
      // Setup the mock to throw an error
      mockHttpClient.get.mockRejectedValue(new Error('API Error'));
      
      // Call the method
      const result = await tvMazeService.getEpisodes(1);
      
      // Verify the result is an empty array
      expect(result).toEqual([]);
      
      // Verify the error was logged
      const { calls } = (console.error as jest.Mock).mock;
      expect(calls.length).toBeGreaterThan(0);
    });
  });
});
