/**
 * TVMaze API Test Utilities
 * 
 * Provides helper functions for testing with the TVMaze API
 */
import type { HttpResponse } from '../../interfaces/httpClient.js';
import { TvMazeFixtures } from '../fixtures/index.js';

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
  mockHttpClient: { 
    mockFixture: (url: string, fixturePath: string) => void;
    mockGet: <T>(url: string, response: HttpResponse<T>) => void;
  },
  date: string,
  country = 'US'
): void {
  // Get endpoint URLs
  const networkEndpoint = getNetworkScheduleUrl(date, country);
  const webEndpoint = getWebScheduleUrl(date);
  
  try {
    // Set up network schedule mock
    mockHttpClient.mockFixture(networkEndpoint, 'network-schedule.json');
    
    // Set up web schedule mock
    mockHttpClient.mockFixture(webEndpoint, 'web-schedule.json');
    
    // Set up individual show mocks for any show IDs that might be requested
    const networkData = TvMazeFixtures.getNetworkSchedule() as NetworkScheduleItem[];
    const webData = TvMazeFixtures.getWebSchedule() as WebScheduleItem[];
    
    // Set up mocks for individual shows if needed
    if (Array.isArray(networkData)) {
      networkData.forEach((item: NetworkScheduleItem) => {
        // Check if show exists and has a valid ID
        const show = item.show;
        if (!show) return;
        
        const showId = show.id;
        if (typeof showId !== 'number' || showId <= 0) return;
        
        const showUrl = getShowUrl(showId);
        mockHttpClient.mockGet(showUrl, {
          status: 200,
          headers: {},
          data: show
        });
      });
    }
    
    if (Array.isArray(webData)) {
      webData.forEach((item: WebScheduleItem) => {
        // Check if _embedded and _embedded.show exist and have a valid ID
        const embedded = item._embedded;
        if (!embedded) return;
        
        const show = embedded.show;
        if (!show) return;
        
        const showId = show.id;
        if (typeof showId !== 'number' || showId <= 0) return;
        
        const showUrl = getShowUrl(showId);
        mockHttpClient.mockGet(showUrl, {
          status: 200,
          headers: {},
          data: show
        });
      });
    }
  } catch (error) {
    console.error('Error setting up TVMaze mocks:', error);
    // Provide fallback empty responses if fixtures can't be loaded
    mockHttpClient.mockGet(networkEndpoint, {
      status: 200,
      headers: {},
      data: []
    });
    
    mockHttpClient.mockGet(webEndpoint, {
      status: 200,
      headers: {},
      data: []
    });
  }
}
