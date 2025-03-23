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
    airtime: '',
    name: 'Test Show',
    season: 0,
    number: 0,
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
  });

  // New tests for error handling
  describe('error handling', () => {
    it('should return an empty array when getShowsByDate encounters an error', async () => {
      // Arrange
      mockHttpClient.getMock.mockRejectedValue(new Error('API Error'));
      
      // Act
      const result = await tvMazeService.getShowsByDate('2025-03-23');
      
      // Assert
      expect(result).toEqual([]);
      expect(mockHttpClient.getMock).toHaveBeenCalled();
    });
    
    it('should return an empty array when searchShows encounters an error', async () => {
      // Arrange
      mockHttpClient.getMock.mockRejectedValue(new Error('API Error'));
      
      // Act
      const result = await tvMazeService.searchShows('test query');
      
      // Assert
      expect(result).toEqual([]);
      expect(mockHttpClient.getMock).toHaveBeenCalled();
    });
    
    it('should return an empty array when fetchShowsWithOptions encounters an error', async () => {
      // Arrange
      mockHttpClient.getMock.mockRejectedValue(new Error('API Error'));
      
      // Act
      const result = await tvMazeService.fetchShowsWithOptions({
        date: '2025-03-23',
        types: ['Scripted']
      });
      
      // Assert
      expect(result).toEqual([]);
      expect(mockHttpClient.getMock).toHaveBeenCalled();
    });
  });

  // New tests for data normalization
  describe('data normalization', () => {
    it('should normalize show data from date endpoint', async () => {
      // Arrange
      const mockRawShow = {
        id: 1,
        name: 'Test Show',
        airdate: '2025-03-23',
        airtime: '20:00',
        show: {
          id: 1,
          name: 'Test Show',
          type: 'Scripted',
          language: 'English',
          genres: ['Drama', 'Thriller'],
          network: { id: 1, name: 'Test Network', country: { code: 'US' } }
        }
      };
      
      mockHttpClient.getMock.mockResolvedValue({
        data: [mockRawShow],
        status: 200,
        headers: {}
      });
      
      // Act
      const result = await tvMazeService.getShowsByDate('2025-03-23');
      
      // Assert
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Test Show');
      expect(result[0].airtime).toBe('');
    });
    
    it('should normalize show data from query endpoint', async () => {
      // Arrange
      const mockRawShow = {
        score: 0.9,
        show: {
          id: 1,
          name: 'Test Show',
          type: 'Scripted',
          language: 'English',
          genres: ['Drama'],
          network: { id: 1, name: 'Test Network', country: { code: 'US' } }
        }
      };
      
      mockHttpClient.getMock.mockResolvedValue({
        data: [mockRawShow],
        status: 200,
        headers: {}
      });
      
      // Act
      const result = await tvMazeService.searchShows('test');
      
      // Assert
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Test Show');
    });
  });

  describe('fetchShowsWithOptions', () => {
    it('should use today\'s date when date is not provided', async () => {
      // Arrange
      mockHttpClient.getMock.mockResolvedValue({
        data: [mockTvMazeShow],
        status: 200,
        headers: {}
      });
      
      // Mock the getTodayDate function to return a fixed date
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => new Date('2025-03-23T12:00:00Z').getTime());
      
      try {
        // Act
        await tvMazeService.fetchShowsWithOptions({});
        
        // Assert
        expect(mockHttpClient.getMock.mock.calls[0][0]).toContain('2025-03-23');
      } finally {
        // Restore original Date.now
        Date.now = originalDateNow;
      }
    });
    
    it('should filter shows by country when country is provided', async () => {
      // Arrange
      const usShow = { ...mockShow };
      const gbShow = { 
        ...mockShow, 
        show: { 
          ...mockShow.show, 
          network: { 
            ...mockShow.show.network, 
            country: { 
              name: 'United Kingdom', 
              code: 'GB', 
              timezone: 'Europe/London' 
            } 
          } 
        } 
      };
      
      mockHttpClient.getMock.mockResolvedValue({
        data: [usShow, gbShow],
        status: 200,
        headers: {}
      });
      
      // Act
      const result = await tvMazeService.fetchShowsWithOptions({
        date: '2025-03-23',
        country: 'GB'
      });
      
      // Assert
      expect(result.length).toBe(1);
      expect(result[0].show.network?.country?.code).toBe('GB');
    });
    
    it(
      'should handle shows with missing network information when filtering by country',
      async () => {
        // Arrange
        const showWithoutNetwork = { 
          ...mockShow, 
          show: { 
            ...mockShow.show, 
            network: null 
          } 
        };
        
        mockHttpClient.getMock.mockResolvedValue({
          data: [showWithoutNetwork],
          status: 200,
          headers: {}
        });
        
        // Act
        const result = await tvMazeService.fetchShowsWithOptions({
          date: '2025-03-23',
          country: 'US'
        });
        
        // Assert
        expect(result.length).toBe(0);
      }
    );
    
    it('should filter shows by type when types are provided', async () => {
      // Arrange
      const scriptedShow = { ...mockShow };
      const realityShow = { 
        ...mockShow, 
        show: { 
          ...mockShow.show, 
          type: 'Reality' 
        } 
      };
      
      mockHttpClient.getMock.mockResolvedValue({
        data: [scriptedShow, realityShow],
        status: 200,
        headers: {}
      });
      
      // Act
      const result = await tvMazeService.fetchShowsWithOptions({
        date: '2025-03-23',
        types: ['Reality']
      });
      
      // Assert
      expect(result.length).toBe(1);
      expect(result[0].show.type).toBe('Reality');
    });
    
    it('should filter shows by network when networks are provided', async () => {
      // Arrange
      const hboShow = { 
        ...mockShow, 
        show: { 
          ...mockShow.show, 
          network: { 
            ...mockShow.show.network, 
            name: 'HBO' 
          } 
        } 
      };
      const netflixShow = { 
        ...mockShow, 
        show: { 
          ...mockShow.show, 
          network: { 
            ...mockShow.show.network, 
            name: 'Netflix' 
          } 
        } 
      };
      
      mockHttpClient.getMock.mockResolvedValue({
        data: [hboShow, netflixShow],
        status: 200,
        headers: {}
      });
      
      // Act
      const result = await tvMazeService.fetchShowsWithOptions({
        date: '2025-03-23',
        networks: ['HBO']
      });
      
      // Assert
      expect(result.length).toBe(1);
      expect(result[0].show.network?.name).toBe('HBO');
    });
    
    it('should filter shows by genre when genres are provided', async () => {
      // Arrange
      const dramaShow = { ...mockShow };
      const comedyShow = { 
        ...mockShow, 
        show: { 
          ...mockShow.show, 
          genres: ['Comedy'] 
        } 
      };
      
      mockHttpClient.getMock.mockResolvedValue({
        data: [dramaShow, comedyShow],
        status: 200,
        headers: {}
      });
      
      // Act
      const result = await tvMazeService.fetchShowsWithOptions({
        date: '2025-03-23',
        genres: ['Comedy']
      });
      
      // Assert
      expect(result.length).toBe(1);
      expect(result[0].show.genres).toContain('Comedy');
    });
    
    it('should filter shows by language when languages are provided', async () => {
      // Arrange
      const englishShow = { ...mockShow };
      const spanishShow = { 
        ...mockShow, 
        show: { 
          ...mockShow.show, 
          language: 'Spanish' 
        } 
      };
      
      mockHttpClient.getMock.mockResolvedValue({
        data: [englishShow, spanishShow],
        status: 200,
        headers: {}
      });
      
      // Act
      const result = await tvMazeService.fetchShowsWithOptions({
        date: '2025-03-23',
        languages: ['Spanish']
      });
      
      // Assert
      expect(result.length).toBe(1);
      expect(result[0].show.language).toBe('Spanish');
    });
  });

  describe('getShows', () => {
    it('should call searchShows when search parameter is provided', async () => {
      // Arrange
      const searchSpy = jest.spyOn(tvMazeService, 'searchShows');
      mockHttpClient.getMock.mockResolvedValue({
        data: mockSearchResult,
        status: 200,
        headers: {}
      });
      
      // Act
      await tvMazeService.getShows({ search: 'test query' });
      
      // Assert
      expect(searchSpy).toHaveBeenCalledWith('test query');
    });
    
    it('should call fetchShowsWithOptions when search parameter is not provided', async () => {
      // Arrange
      const fetchSpy = jest.spyOn(tvMazeService, 'fetchShowsWithOptions');
      mockHttpClient.getMock.mockResolvedValue({
        data: [mockTvMazeShow],
        status: 200,
        headers: {}
      });
      
      // Act
      await tvMazeService.getShows({ date: '2025-03-23' });
      
      // Assert
      expect(fetchSpy).toHaveBeenCalledWith({
        date: '2025-03-23',
        country: undefined,
        types: undefined,
        networks: undefined,
        genres: undefined,
        languages: undefined
      });
    });
    
    it('should call fetchShowsWithOptions when search parameter is empty', async () => {
      // Arrange
      const fetchSpy = jest.spyOn(tvMazeService, 'fetchShowsWithOptions');
      mockHttpClient.getMock.mockResolvedValue({
        data: [mockTvMazeShow],
        status: 200,
        headers: {}
      });
      
      // Act
      await tvMazeService.getShows({ search: '', date: '2025-03-23' });
      
      // Assert
      expect(fetchSpy).toHaveBeenCalled();
    });
  });
});
