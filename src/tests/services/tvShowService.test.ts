/**
 * Tests for the TvShowService implementation
 */
import 'reflect-metadata';
import { describe, it, beforeEach, expect, afterEach, jest } from '@jest/globals';
import { container, InjectionToken } from 'tsyringe';

import { TvMazeServiceImpl } from '../../implementations/tvMazeServiceImpl.js';
import type { Show, ShowDetails } from '../../types/tvmaze.js';
import { MockHttpClient } from '../utils/mockHttpClient.js';
import { groupShowsByNetwork } from '../../utils/showUtils.js';

// Create a mock HTTP client and service instance
let mockClient: MockHttpClient;
let tvShowService: TvMazeServiceImpl;

// Type-safe way to check if a network exists in the groups and get its shows
function hasNetwork(groups: Record<string, Show[]>, network: string): boolean {
  return Object.prototype.hasOwnProperty.call(groups, network);
}

function getShowsCount(groups: Record<string, Show[]>, network: string): number {
  if (hasNetwork(groups, network)) {
    return groups[network].length;
  }
  return 0;
}

// Create a mock TV show that matches ShowDetails type
const mockTvShowDetails: ShowDetails = {
  id: 1,
  name: 'NCIS',
  type: 'Scripted',
  language: 'English',
  genres: ['Drama', 'Crime'],
  network: {
    id: 1,
    name: 'CBS',
    country: {
      name: 'United States',
      code: 'US',
      timezone: 'America/New_York'
    }
  },
  webChannel: null,
  image: null,
  summary: 'NCIS is a show about naval criminal investigators.'
};

// Create a web show details
const _mockWebShowDetails: ShowDetails = {
  id: 2,
  name: 'Web Show',
  type: 'Web Series',
  language: 'English',
  genres: ['Comedy'],
  network: null,
  webChannel: {
    id: 2,
    name: 'Netflix',
    country: null
  },
  image: null,
  summary: 'A web show about web things.'
};

// Create mock shows for testing
const _mockWebShow: Show = {
  name: 'Web Show Episode',
  airtime: '22:00',
  season: 1,
  number: 1,
  show: _mockWebShowDetails
};

const _mockSpanishShow: Show = {
  name: 'Spanish Show Episode',
  airtime: '21:00',
  season: 1,
  number: 1,
  show: {
    id: 3,
    name: 'Spanish Drama',
    type: 'Scripted',
    language: 'Spanish',
    genres: ['Drama'],
    network: {
      id: 3,
      name: 'Telemundo',
      country: {
        name: 'United States',
        code: 'US',
        timezone: 'America/New_York'
      }
    },
    webChannel: null,
    image: null,
    summary: 'A Spanish drama series'
  }
};

const _mockUKShow: Show = {
  name: 'UK Show Episode',
  airtime: '19:00',
  season: 1,
  number: 1,
  show: {
    id: 4,
    name: 'British Comedy',
    type: 'Scripted',
    language: 'English',
    genres: ['Comedy'],
    network: {
      id: 4,
      name: 'BBC',
      country: {
        name: 'United Kingdom',
        code: 'GB',
        timezone: 'Europe/London'
      }
    },
    webChannel: null,
    image: null,
    summary: 'A British comedy series'
  }
};

describe('tvShowService', () => {
  beforeEach(() => {
    // Reset the mock client and create a new service instance
    mockClient = new MockHttpClient();
    
    // Register the mock client in the container
    container.register('HttpClient', {
      useValue: mockClient
    });
    
    // Create the service
    tvShowService = container.resolve(TvMazeServiceImpl as InjectionToken<TvMazeServiceImpl>);
  });
  
  describe('groupShowsByNetwork', () => {
    it('groups shows by network', () => {
      // Setup test data
      const shows: Show[] = [
        {
          name: 'NCIS Episode',
          season: 1,
          number: 1,
          airtime: '20:00',
          show: mockTvShowDetails
        }
      ];
      
      // Call the utility function directly instead of going through the service
      const result = groupShowsByNetwork(shows);
      
      // Use our type-safe helper functions to verify the result
      expect(hasNetwork(result as Record<string, Show[]>, 'CBS')).toBe(true);
      expect(getShowsCount(result as Record<string, Show[]>, 'CBS')).toBe(1);
      expect(hasNetwork(result as Record<string, Show[]>, 'Unknown Network')).toBe(false);
      expect(getShowsCount(result as Record<string, Show[]>, 'Unknown Network')).toBe(0);
    });
    
    it('handles shows with no network', () => {
      // Setup test data with no network
      const shows: Show[] = [
        {
          name: 'No Network Show',
          airtime: '20:00',
          season: 1,
          number: 1,
          show: {
            ...mockTvShowDetails,
            network: null
          }
        }
      ];
      
      // Call the utility function directly instead of going through the service
      const result = groupShowsByNetwork(shows);
      
      // Use our type-safe helper functions to verify the result
      expect(hasNetwork(result as Record<string, Show[]>, 'Unknown Network')).toBe(true);
      expect(getShowsCount(result as Record<string, Show[]>, 'Unknown Network')).toBe(1);
    });
    
    it('handles web channel shows', () => {
      // Setup test data with web channel
      const webChannelShow: Show = {
        name: 'Web Channel Show',
        airtime: '20:00',
        season: 1,
        number: 1,
        show: {
          ...mockTvShowDetails,
          network: null,
          webChannel: {
            id: 1,
            name: 'Netflix',
            country: null
          }
        }
      };
      
      const regularShow: Show = {
        name: 'NCIS Episode',
        airtime: '20:00',
        season: 1,
        number: 1,
        show: mockTvShowDetails
      };
      
      // Call the utility function directly instead of going through the service
      const result = groupShowsByNetwork([webChannelShow, regularShow]);
      
      // Use our type-safe helper functions to verify the result
      const networks = Object.keys(result as Record<string, Show[]>).sort();
      expect(networks).toEqual(['CBS', 'Netflix'].sort());
      expect(getShowsCount(result as Record<string, Show[]>, 'Netflix')).toBe(1);
      expect(getShowsCount(result as Record<string, Show[]>, 'CBS')).toBe(1);
    });
  });
  
  describe('fetchShowsWithOptions', () => {
    it('fetches shows with default options', async () => {
      // Mock the getShowsByDate method
      const mockShow = {
        name: 'NCIS Episode',
        season: 1,
        number: 1,
        airtime: '20:00',
        show: mockTvShowDetails
      };
      
      // Get the current date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Set up the mock response for the HTTP client
      mockClient.mockGet(`https://api.tvmaze.com/schedule?date=${today}`, {
        data: [mockShow],
        status: 200,
        headers: {}
      });
      
      // Call the method with no options
      const result = await tvShowService.fetchShowsWithOptions({});
      
      // Verify the result
      expect(result).toHaveLength(1);
      expect(result[0].show.name).toBe('NCIS');
    });
  });
  
  describe('getShowsByDate', () => {
    let originalConsoleError: typeof console.error;
    
    beforeEach(() => {
      // Save the original console.error
      originalConsoleError = console.error;
      // Mock console.error to suppress expected error messages during tests
      console.error = jest.fn();
    });
    
    afterEach(() => {
      // Restore the original console.error
      console.error = originalConsoleError;
    });
    
    it('fetches shows for a specific date', async () => {
      // Setup mock response with a properly structured Show array
      const mockShowResponse: Show[] = [{
        name: 'NCIS Episode',
        season: 1,
        number: 1,
        airtime: '20:00',
        show: mockTvShowDetails
      }];
      
      mockClient.setMockResponse({
        data: mockShowResponse,
        status: 200,
        headers: {}
      });
      
      // Call the method
      const result = await tvShowService.getShowsByDate('2025-03-20');
      
      // Verify the result
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('NCIS Episode');
      expect(mockClient.lastUrl).toContain('schedule?date=2025-03-20');
    });
    
    it('handles API errors gracefully', async () => {
      // Setup mock error response
      mockClient.setMockError(new Error('API Error'));
      
      const result = await tvShowService.getShowsByDate('2025-03-20');
      
      expect(result).toEqual([]);
    });
  });
  
  describe('searchShows', () => {
    let originalConsoleError: typeof console.error;
    
    beforeEach(() => {
      // Save the original console.error
      originalConsoleError = console.error;
      // Mock console.error to suppress expected error messages during tests
      console.error = jest.fn();
    });
    
    afterEach(() => {
      // Restore the original console.error
      console.error = originalConsoleError;
    });
    
    it('searches for shows by query', async () => {
      // Setup mock response with the expected structure for searchShows
      // The API returns an array of objects with a 'show' property
      mockClient.setMockResponse({
        data: [{ 
          show: {
            ...mockTvShowDetails,
            // Add the 'show' property that normalizeShowData expects
            show: mockTvShowDetails
          }
        }],
        status: 200,
        headers: {}
      });
      
      // Call the method
      const result = await tvShowService.searchShows('NCIS');
      
      // Verify the result
      // The implementation normalizes the data, so we expect a flat Show object
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(mockTvShowDetails.name);
      expect(mockClient.lastUrl).toContain('search/shows?q=NCIS');
    });
  });
});
