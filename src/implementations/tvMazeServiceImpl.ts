/**
 * Implementation of the TvShowService interface using the TVMaze API
 */
import { inject, injectable } from 'tsyringe';
import type { HttpClient } from '../interfaces/httpClient.js';
import type { Show } from '../types/tvShowModel.js';
import type { ShowOptions } from '../types/tvShowOptions.js';
import type { TvShowService } from '../interfaces/tvShowService.js';
import { transformSchedule } from '../types/tvmazeModel.js';
import { getNetworkScheduleUrl, getWebScheduleUrl } from '../utils/tvMazeUtils.js';

/**
 * Implementation of the TvShowService interface for the TVMaze API
 */
@injectable()
export class TvMazeServiceImpl implements TvShowService {
  private _apiClient: HttpClient;

  constructor(@inject('HttpClient') apiClient: HttpClient) {
    this._apiClient = apiClient;
  }

  /**
   * Generic method to fetch schedule data from any TVMaze API endpoint
   * @param url - The full URL to fetch data from
   * @returns Promise resolving to an array of raw schedule items
   * @private
   */
  private async getSchedule(url: string): Promise<Record<string, unknown>[]> {
    try {
      const response = await this._apiClient.get<unknown[]>(url);
      if (Array.isArray(response.data)) {
        return response.data as Record<string, unknown>[];
      }
      return [];
    } catch (error) {
      // Only log errors in production environments
      if (process.env.NODE_ENV === 'production') {
        console.error(`Error fetching schedule from ${url}:`, error);
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
    // Default options
    const defaultOptions: ShowOptions = {
      date: '',
      country: 'US',
      showAll: false,
      webOnly: false,
      types: [],
      genres: [],
      languages: [],
      networks: []
    };

    // Merge options with defaults
    const mergedOptions: ShowOptions = {
      ...defaultOptions,
      ...options
    };

    // Get date string, default to today if not provided
    const dateStr = mergedOptions.date !== undefined && 
      mergedOptions.date !== null && 
      mergedOptions.date.trim() !== '' 
      ? mergedOptions.date.trim() 
      : new Date().toISOString().split('T')[0];
      
    const countryStr = mergedOptions.country !== undefined && 
      mergedOptions.country !== null && 
      mergedOptions.country.trim() !== '' 
      ? mergedOptions.country.trim() 
      : 'US';
    
    // URLs to fetch based on options
    const urlsToFetch: string[] = [];
    
    try {
      // Determine which URLs to fetch based on options
      if (mergedOptions.webOnly === true) {
        // Web-only: just fetch the web schedule
        urlsToFetch.push(getWebScheduleUrl(dateStr));
      } else if (mergedOptions.showAll === true) {
        // Show all: fetch both network and web schedules
        urlsToFetch.push(getNetworkScheduleUrl(dateStr, countryStr));
        urlsToFetch.push(getWebScheduleUrl(dateStr));
      } else {
        // Default: fetch only network schedule
        urlsToFetch.push(getNetworkScheduleUrl(dateStr, countryStr));
      }

      // Fetch all schedules in parallel
      const schedulePromises = urlsToFetch.map(url => this.getSchedule(url));
      const scheduleResults = await Promise.all(schedulePromises);
      
      // Transform and combine all schedule results
      let shows: Show[] = [];
      
      if (scheduleResults.length === 1) {
        // Single schedule (either network-only or web-only)
        shows = transformSchedule(scheduleResults[0]);
      } else if (scheduleResults.length === 2) {
        // Both network and web schedules
        const networkShows = transformSchedule(scheduleResults[0]);
        const webShows = transformSchedule(scheduleResults[1]);
        
        // Combine the results
        shows = [...networkShows, ...webShows];
      }
      
      // Apply filters if any are specified
      const hasTypes = Array.isArray(mergedOptions.types) && 
        mergedOptions.types.length > 0;
      const hasGenres = Array.isArray(mergedOptions.genres) && 
        mergedOptions.genres.length > 0;
      const hasLanguages = Array.isArray(mergedOptions.languages) && 
        mergedOptions.languages.length > 0;
      const hasNetworks = Array.isArray(mergedOptions.networks) && 
        mergedOptions.networks.length > 0;
      
      if (hasTypes || hasGenres || hasLanguages || hasNetworks) {
        shows = this.applyFilters(shows, mergedOptions);
      }
      
      return shows;
    } catch (error) {
      // Only log errors in production environments
      if (process.env.NODE_ENV === 'production') {
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
    if (!Array.isArray(shows) || shows.length === 0) {
      return [];
    }

    let filteredShows = [...shows];

    // Apply country filter
    const countryValue = options.country;
    if (typeof countryValue === 'string' && countryValue.trim() !== '') {
      filteredShows = filteredShows.filter((show: Show) => {
        return typeof show.network === 'string' && 
              show.network.includes(countryValue);
      });
    }

    // Apply type filter
    const typeValues = options.types;
    if (Array.isArray(typeValues) && typeValues.length > 0) {
      filteredShows = filteredShows.filter((show: Show) => {
        return typeof show.type === 'string' && 
               typeValues.some((type: string) => 
                 show.type.toLowerCase() === type.toLowerCase()
               );
      });
    }

    // Apply network filter
    const networkValues = options.networks;
    if (Array.isArray(networkValues) && networkValues.length > 0) {
      filteredShows = filteredShows.filter((show: Show) => {
        return typeof show.network === 'string' && 
               networkValues.some((network: string) => 
                 show.network.toLowerCase().includes(network.toLowerCase())
               );
      });
    }

    // Apply genre filter
    const genreValues = options.genres;
    if (Array.isArray(genreValues) && genreValues.length > 0) {
      filteredShows = filteredShows.filter((show: Show) => {
        return Array.isArray(show.genres) && 
               genreValues.some((genre: string) => 
                 show.genres.some((showGenre: string) => 
                   showGenre.toLowerCase() === genre.toLowerCase()
                 )
               );
      });
    }

    // Apply language filter
    const languageValues = options.languages;
    if (Array.isArray(languageValues) && languageValues.length > 0) {
      filteredShows = filteredShows.filter((show: Show) => {
        return typeof show.language === 'string' && 
               show.language !== null && 
               languageValues.some((language: string) => 
                 show.language !== null && 
                 show.language.toLowerCase() === language.toLowerCase()
               );
      });
    }

    return filteredShows;
  }
}
