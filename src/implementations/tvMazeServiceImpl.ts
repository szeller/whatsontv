/**
 * Implementation of the TvShowService interface using the TVMaze API
 */
import { inject, injectable } from 'tsyringe';
import type { HttpClient } from '../interfaces/httpClient.js';
import type { TvShowService } from '../interfaces/tvShowService.js';
import type { Show } from '../schemas/domain.js';
import type { ShowOptions } from '../types/tvShowOptions.js';
import { 
  getNetworkScheduleUrl, 
  getWebScheduleUrl, 
  transformSchedule 
} from '../utils/tvMazeUtils.js';
import { getTodayDate } from '../utils/dateUtils.js';
import { getStringOrDefault } from '../utils/stringUtils.js';

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
      fetchSource: 'all',
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
    const dateStr = getStringOrDefault(mergedOptions.date, getTodayDate());
    const countryStr = getStringOrDefault(mergedOptions.country, 'US');
    
    try {
      // URLs to fetch based on options
      const urlsToFetch: string[] = [];

      // Determine which sources to fetch based on fetchSource
      if (mergedOptions.fetchSource === 'all' || mergedOptions.fetchSource === 'network') {
        urlsToFetch.push(getNetworkScheduleUrl(dateStr, countryStr));
      }

      if (mergedOptions.fetchSource === 'all' || mergedOptions.fetchSource === 'web') {
        urlsToFetch.push(getWebScheduleUrl(dateStr));
      }

      // Fetch all schedules in parallel
      const schedulePromises = urlsToFetch.map(url => this.getSchedule(url));
      const scheduleResults = await Promise.all(schedulePromises);
      
      // Transform and combine all schedule results using a functional approach
      let shows = scheduleResults
        .map(scheduleResult => transformSchedule(scheduleResult))
        .flat();
      
      // Deduplicate shows based on unique combination of show ID and episode
      shows = this.deduplicateShows(shows);
      
      // Always apply filters - the applyFilters method will handle empty filter arrays
      shows = this.applyFilters(shows, mergedOptions);
      
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

    // Filter out shows without episode numbers (specials, etc.)
    filteredShows = filteredShows.filter((show: Show) => {
      return typeof show.number === 'number' && show.number > 0;
    });

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
                 show.language?.toLowerCase() === language.toLowerCase()
               );
      });
    }

    return filteredShows;
  }

  /**
   * Deduplicate shows based on unique combination of show ID and episode
   * @param shows Shows to deduplicate
   * @returns Deduplicated shows
   * @private
   */
  private deduplicateShows(shows: Show[]): Show[] {
    if (!Array.isArray(shows) || shows.length === 0) {
      return [];
    }

    const showMap: Map<string, Show> = new Map();

    shows.forEach((show: Show) => {
      // Create a unique key using show ID, season, and episode number
      const key = `${show.id}-${show.season}-${show.number}`;
      if (!showMap.has(key)) {
        showMap.set(key, show);
      }
    });

    return Array.from(showMap.values());
  }
}
