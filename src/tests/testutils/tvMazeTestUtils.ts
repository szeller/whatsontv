/**
 * TVMaze API Test Utilities
 * 
 * Provides helper functions for testing with the TVMaze API
 */
import type { HttpClient } from '../../interfaces/httpClient.js';
import { Fixtures } from '../fixtures/index.js';
import { jest } from '@jest/globals';

/**
 * Interface for network schedule item
 */
interface NetworkScheduleItem {
  id: number;
  show?: {
    id: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Interface for web schedule item
 */
interface WebScheduleItem {
  id: number;
  _embedded?: {
    show?: {
      id: number;
      [key: string]: unknown;
    };
  };
  [key: string]: unknown;
}

/**
 * Base URLs for TVMaze API endpoints
 */
export const TVMAZE_API = {
  BASE_URL: 'https://api.tvmaze.com',
  SCHEDULE_ENDPOINT: '/schedule',
  WEB_SCHEDULE_ENDPOINT: '/schedule/web',
  SHOW_ENDPOINT: '/shows',
  SEARCH_ENDPOINT: '/search/shows'
};

/**
 * Get the URL for the network schedule endpoint
 * @param date Date in YYYY-MM-DD format
 * @param country Country code (default: 'US')
 * @returns Full URL for the network schedule endpoint
 */
export function getNetworkScheduleUrl(date: string, country = 'US'): string {
  return `${TVMAZE_API.BASE_URL}${TVMAZE_API.SCHEDULE_ENDPOINT}?date=${date}&country=${country}`;
}

/**
 * Get the URL for the web/streaming schedule endpoint
 * @param date Date in YYYY-MM-DD format
 * @returns Full URL for the web schedule endpoint
 */
export function getWebScheduleUrl(date: string): string {
  return `${TVMAZE_API.BASE_URL}${TVMAZE_API.WEB_SCHEDULE_ENDPOINT}?date=${date}`;
}

/**
 * Get the URL for a specific show by ID
 * @param showId Show ID
 * @returns Full URL for the show endpoint
 */
export function getShowUrl(showId: number): string {
  return `${TVMAZE_API.BASE_URL}${TVMAZE_API.SHOW_ENDPOINT}/${showId}`;
}

/**
 * Get the URL for searching shows by query
 * @param query Search query
 * @returns Full URL for the search endpoint
 */
export function getSearchUrl(query: string): string {
  return `${TVMAZE_API.BASE_URL}${TVMAZE_API.SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`;
}

/**
 * Setup common TVMaze API mock responses
 * @param mockHttpClient The mock HTTP client to configure
 * @param date Date to use for schedule endpoints (default: today)
 * @param country Country code to use (default: 'US')
 */
export function setupTvMazeMocks(
  mockHttpClient: HttpClient,
  date: string,
  country = 'US'
): void {
  // Get endpoint URLs
  const networkEndpoint = getNetworkScheduleUrl(date, country);
  const webEndpoint = getWebScheduleUrl(date);
  
  try {
    // Load fixture data
    const networkData = Fixtures.tvMaze.getSchedule('network-schedule') as NetworkScheduleItem[];
    const webData = Fixtures.tvMaze.getSchedule('web-schedule') as WebScheduleItem[];
    
    // Set up mock implementation for the get method
    jest.spyOn(mockHttpClient, 'get').mockImplementation(async (_url: string) => {
      // Network schedule endpoint
      if (_url === networkEndpoint) {
        return Promise.resolve({
          status: 200,
          headers: {},
          data: networkData
        });
      }
      
      // Web schedule endpoint
      if (_url === webEndpoint) {
        return Promise.resolve({
          status: 200,
          headers: {},
          data: webData
        });
      }
      
      // Individual show endpoints
      if (_url.startsWith(`${TVMAZE_API.BASE_URL}${TVMAZE_API.SHOW_ENDPOINT}/`)) {
        const showIdMatch = /\/shows\/(\d+)$/.exec(_url);
        if (showIdMatch) {
          const showId = parseInt(showIdMatch[1], 10);
          
          // Look for the show in network data
          if (Array.isArray(networkData)) {
            for (const item of networkData) {
              if (item.show?.id === showId) {
                return Promise.resolve({
                  status: 200,
                  headers: {},
                  data: item.show
                });
              }
            }
          }
          
          // Look for the show in web data
          if (Array.isArray(webData)) {
            for (const item of webData) {
              if (item._embedded?.show?.id === showId) {
                return Promise.resolve({
                  status: 200,
                  headers: {},
                  data: item._embedded.show
                });
              }
            }
          }
        }
      }
      
      // Default fallback for any other URLs
      return Promise.resolve({
        status: 404,
        headers: {},
        data: null
      });
    });
  } catch (error) {
    console.error('Error setting up TVMaze mocks:', error);
    
    // Provide fallback empty responses if fixtures can't be loaded
    jest.spyOn(mockHttpClient, 'get').mockImplementation(async (_url: string) => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: []
      });
    });
  }
}
