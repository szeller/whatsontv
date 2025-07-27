/**
 * Implementation of the TvShowService interface using the TVMaze API
 */
import { inject, injectable } from 'tsyringe';
import type { HttpClient } from '../interfaces/httpClient.js';
import type { LoggerService } from '../interfaces/loggerService.js';
import type { TvShowService } from '../interfaces/tvShowService.js';
import type { Show } from '../schemas/domain.js';
import type { ShowOptions } from '../types/tvShowOptions.js';
import { 
  getNetworkScheduleUrl, 
  getWebScheduleUrl, 
  transformSchedule 
} from '../utils/tvMazeUtils.js';
import { convertTimeToMinutes, getTodayDate } from '../utils/dateUtils.js';
import { getStringOrDefault } from '../utils/stringUtils.js';

/**
 * Implementation of the TvShowService interface for the TVMaze API
 */
@injectable()
export class TvMazeServiceImpl implements TvShowService {
  private _apiClient: HttpClient;
  private readonly logger: LoggerService;

  constructor(
    @inject('HttpClient') apiClient: HttpClient,
    @inject('LoggerService') logger?: LoggerService
  ) {
    this._apiClient = apiClient;
    this.logger = logger?.child({ module: 'TvMazeService' }) ?? {
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {},
      child: () => this.logger
    } as LoggerService;
  }

  /**
   * Generic method to fetch schedule data from any TVMaze API endpoint
   * @param url - The full URL to fetch data from
   * @returns Promise resolving to an array of raw schedule items
   * @private
   */
  private async getSchedule(url: string): Promise<Record<string, unknown>[]> {
    const startTime = Date.now();
    try {
      const response = await this._apiClient.get<unknown[]>(url);
      if (Array.isArray(response.data)) {
        // Log successful API call
        this.logger.info({
          url,
          showCount: response.data.length,
          duration: Date.now() - startTime,
          statusCode: response.status
        }, 'Successfully fetched schedule from TVMaze API');
        return response.data as Record<string, unknown>[];
      }
      return [];
    } catch (error) {
      // Log errors with structured logging for better observability
      this.logger.error({
        error: String(error),
        url,
        duration: Date.now() - startTime,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Failed to fetch schedule from TVMaze API');
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
    
    // URLs to fetch based on options
    const urlsToFetch: string[] = [];
    
    try {

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
      // Log errors with structured logging for better observability
      this.logger.error({
        error: String(error),
        options: mergedOptions,
        urlsCount: urlsToFetch.length,
        environment: process.env.NODE_ENV,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Failed to fetch TV shows');
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
        if (typeof show.network !== 'string') {
          return false;
        }
        
        // Remove country codes for exact matching
        const showNetwork = show.network.replace(/\s+\([A-Z]{2}\)$/, '').toLowerCase();
        
        return networkValues.some((network: string) => 
          showNetwork === network.toLowerCase()
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
        // Skip shows with no language
        if (typeof show.language !== 'string' || show.language === null) {
          return false;
        }
        
        // Case-insensitive language matching
        const showLanguage = show.language;
        return languageValues.some((language: string) => 
          showLanguage.toLowerCase() === language.toLowerCase()
        );
      });
    }
    
    // Apply minimum airtime filter
    const minAirtime = options.minAirtime;
    if (minAirtime !== undefined && minAirtime !== null && minAirtime !== '') {
      // Convert minAirtime to minutes for comparison
      const minTimeInMinutes = convertTimeToMinutes(minAirtime);
      
      if (minTimeInMinutes >= 0) {
        filteredShows = filteredShows.filter((show: Show) => {
          // Skip shows with no airtime (streaming shows often have no airtime)
          if (show.airtime === undefined || 
              show.airtime === null || 
              show.airtime.trim() === '') {
            return true;
          }
          
          const showTimeInMinutes = convertTimeToMinutes(show.airtime);
          return showTimeInMinutes >= minTimeInMinutes;
        });
      }
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
