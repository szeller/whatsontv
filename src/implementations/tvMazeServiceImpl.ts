/**
 * Implementation of the TvShowService interface for the TVMaze API
 */
import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';

// Type imports
import type { TvShowService } from '../interfaces/tvShowService.js';
import type { Show } from '../types/tvShowModel.js';
import type { ShowOptions } from '../types/tvShowOptions.js';
import type { HttpClient } from '../interfaces/httpClient.js';
import { 
  filterByGenre, 
  filterByLanguage, 
  filterByNetwork, 
  filterByType,
  filterByCountry
} from '../utils/showUtils.js';
import { getTodayDate } from '../utils/dateUtils.js';
import { transformSchedule } from '../types/tvmazeModel.js';
import { getNetworkScheduleUrl, getWebScheduleUrl } from '../utils/tvMazeUtils.js';

/**
 * Implementation of the TvShowService interface for the TVMaze API
 */
@injectable()
export class TvMazeServiceImpl implements TvShowService {
  private _apiClient: HttpClient;

  constructor(@inject('HttpClient') httpClient: HttpClient) {
    this._apiClient = httpClient;
  }

  /**
   * Get shows for a specific date from the traditional network schedule
   * @param date - Date in YYYY-MM-DD format
   * @param country - Optional country code (e.g., 'US')
   * @returns Promise resolving to an array of raw schedule items
   * @private
   */
  private async getNetworkSchedule(date: string, country?: string): Promise<unknown[]> {
    const endpoint = getNetworkScheduleUrl(date, country);
    
    try {
      // Make the API request
      const response = await this._apiClient.get(endpoint);
      
      // If no data is returned, return empty array
      if (!Array.isArray(response.data) || response.data.length === 0) {
        return [];
      }
      
      return response.data as unknown[];
    } catch (error) {
      // Only log errors in production environments, not during tests
      if (process.env.NODE_ENV !== 'test') {
        console.error('TvMazeServiceImpl.getNetworkSchedule error:', error);
      }
      
      return [];
    }
  }

  /**
   * Get shows for a specific date from the web/streaming schedule
   * @param date - Date in YYYY-MM-DD format
   * @returns Promise resolving to an array of raw schedule items
   * @private
   */
  private async getWebSchedule(date: string): Promise<unknown[]> {
    const endpoint = getWebScheduleUrl(date);
    
    try {
      // Log the endpoint in test environment
      if (process.env.NODE_ENV === 'test') {
        console.warn('Making GET request to:', endpoint);
      }
      
      // Make the API request
      const response = await this._apiClient.get(endpoint);
      
      // If no data is returned, return empty array
      if (!Array.isArray(response.data) || response.data.length === 0) {
        if (process.env.NODE_ENV === 'test') {
          console.warn('No web schedule data returned from API');
        }
        return [];
      }
      
      // Log the number of items in test environment
      if (process.env.NODE_ENV === 'test') {
        console.warn(`Web schedule data returned: ${response.data.length} items`);
      }
      
      return response.data as unknown[];
    } catch (error) {
      // Only log errors in production environments, not during tests
      if (process.env.NODE_ENV !== 'test') {
        console.error('TvMazeServiceImpl.getWebSchedule error:', error);
      } else {
        console.warn('TvMazeServiceImpl.getWebSchedule error:', error);
      }
      
      return [];
    }
  }

  /**
   * Fetch TV shows based on the provided options
   * @param options Options for filtering shows
   * @returns Promise resolving to an array of shows
   */
  async fetchShows(options?: Partial<ShowOptions>): Promise<Show[]> {
    try {
      // Set default values if not provided
      const mergedOptions: ShowOptions = {
        date: getTodayDate(),
        country: 'US',
        types: [],
        networks: [],
        genres: [],
        languages: [],
        webOnly: false,
        showAll: false,
        ...options
      };
      
      // These are now guaranteed to be defined due to the defaults
      const date = mergedOptions.date;
      const country = mergedOptions.country;
      
      let shows: Show[] = [];
      
      // Determine which API endpoints to call based on options
      if (mergedOptions.webOnly === true) {
        // Fetch only web schedule
        const webSchedule = await this.getWebSchedule(date);
        shows = transformSchedule(webSchedule, true);
      } else if (mergedOptions.showAll === true) {
        // Fetch both network and web schedules
        const [networkSchedule, webSchedule] = await Promise.all([
          this.getNetworkSchedule(date, country),
          this.getWebSchedule(date)
        ]);
        
        const networkShows = transformSchedule(networkSchedule, false);
        const webShows = transformSchedule(webSchedule, true);
        
        shows = [...networkShows, ...webShows];
        
        // Log in test environment
        if (process.env.NODE_ENV === 'test') {
          console.warn(
            `Combined shows: ${shows.length} (` +
            `${networkShows.length} network, ${webShows.length} web)`
          );
        }
      } else {
        // Default: fetch only network schedule
        const networkSchedule = await this.getNetworkSchedule(date, country);
        shows = transformSchedule(networkSchedule, false);
      }
      
      // Apply filters
      return this.applyFilters(shows, mergedOptions);
    } catch (error) {
      // Only log errors in production environments, not during tests
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error fetching shows:', error);
      }
      return [];
    }
  }

  /**
   * Apply filters to shows based on options
   * @param shows Shows to filter
   * @param options Filter options
   * @returns Filtered shows
   * @private
   */
  private applyFilters(shows: Show[], options: ShowOptions): Show[] {
    let filteredShows = [...shows];
    
    // Apply country filter
    if (options.country !== undefined && options.country !== null && options.country !== '') {
      filteredShows = filterByCountry(filteredShows, options.country);
    }
    
    // Apply type filter
    if (options.types && options.types.length > 0) {
      filteredShows = filterByType(filteredShows, options.types);
      
      // Log in test environment
      if (process.env.NODE_ENV === 'test') {
        console.warn(`Filtering by types: ${options.types.join(', ')}`);
        console.warn(`Filtered shows: ${filteredShows.length}`);
      }
    }
    
    // Apply network filter
    if (options.networks && options.networks.length > 0) {
      filteredShows = filterByNetwork(filteredShows, options.networks);
      
      // Log in test environment
      if (process.env.NODE_ENV === 'test') {
        console.warn(`Filtering by networks: ${options.networks.join(', ')}`);
        console.warn(`Filtered shows: ${filteredShows.length}`);
      }
    }
    
    // Apply genre filter
    if (options.genres && options.genres.length > 0) {
      filteredShows = filterByGenre(filteredShows, options.genres);
      
      // Log in test environment
      if (process.env.NODE_ENV === 'test') {
        console.warn(`Filtering by genres: ${options.genres.join(', ')}`);
        console.warn(`Filtered shows: ${filteredShows.length}`);
      }
    }
    
    // Apply language filter
    if (options.languages && options.languages.length > 0) {
      filteredShows = filterByLanguage(filteredShows, options.languages);
      
      // Log in test environment
      if (process.env.NODE_ENV === 'test') {
        console.warn(`Filtering by languages: ${options.languages.join(', ')}`);
        console.warn(`Filtered shows: ${filteredShows.length}`);
      }
    }
    
    return filteredShows;
  }
}
