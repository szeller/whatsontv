/**
 * Implementation of the TvShowService interface for the TVMaze API
 */
import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';

// Type imports
import type { TvShowService } from '../interfaces/tvShowService.js';
import type { Show, TVMazeShow } from '../types/tvmaze.js';
import type { HttpClient } from '../interfaces/httpClient.js';
import { 
  filterByGenre, 
  filterByLanguage, 
  filterByNetwork, 
  filterByType, 
  getTodayDate,
  normalizeShowData
} from '../utils/showUtils.js';

// Constants
const TV_MAZE_API = 'https://api.tvmaze.com';
const NO_DATA_MESSAGE = 'No data returned';

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
   * Get shows for a specific date
   * @param date - Date in YYYY-MM-DD format
   * @returns Promise resolving to an array of shows
   */
  async getShowsByDate(date: string): Promise<Show[]> {
    try {
      // console.warn(`TvMazeServiceImpl: Fetching shows for date ${date}`); 
      const endpoint = `${TV_MAZE_API}/schedule?date=${date}&country=US`;
      
      // Make the API request
      const response = await this._apiClient.get<TVMazeShow[]>(endpoint);
      
      // console.warn(`TvMazeServiceImpl: Received ${response.data?.length || 0} shows from API`);
      
      // If no data is returned, throw an error
      if (!Array.isArray(response.data) || response.data.length === 0) {
        throw new Error(NO_DATA_MESSAGE);
      }
      
      // Normalize the data
      return response.data.map(show => normalizeShowData(show));
    } catch (error) {
      console.error('TvMazeServiceImpl.getShowsByDate error:', error);
      
      // Return empty array instead of rethrowing
      return [];
    }
  }

  /**
   * Search for shows by name
   * @param query - Search query
   * @returns Promise resolving to an array of shows
   */
  async searchShows(query: string): Promise<Show[]> {
    try {
      const response = await this._apiClient.get<Array<{ show: TVMazeShow }>>(
        `${TV_MAZE_API}/search/shows?q=${encodeURIComponent(query)}`
      );

      // Check if data exists and has length
      if (Array.isArray(response.data) && response.data.length === 0) {
        console.error(`Error searching for shows with query "${query}": ${NO_DATA_MESSAGE}`);
        return [];
      }

      // Transform the API response to our Show type
      return response.data.map(item => normalizeShowData(item.show));
    } catch (error) {
      console.error(`Error searching for shows with query "${query}":`, error);
      return [];
    }
  }

  /**
   * Fetch shows with advanced filtering options
   * @param options - Options for filtering shows
   * @returns Promise resolving to array of shows
   */
  async fetchShowsWithOptions(options: {
    date?: string;
    country?: string;
    types?: string[];
    networks?: string[];
    genres?: string[];
    languages?: string[];
  }): Promise<Show[]> {
    try {
      // Use today's date if not specified
      const date = options.date ?? getTodayDate();
      
      // Get shows for the specified date
      let shows = await this.getShowsByDate(date);
      
      // Apply filters if provided
      const hasCountry = options.country !== undefined && 
                        options.country !== null && 
                        options.country.trim() !== '';
      
      if (hasCountry) {
        shows = shows.filter(show => {
          const countryCode = show.show.network?.country?.code;
          if (typeof countryCode !== 'string') {
            return false;
          }
          return countryCode === options.country;
        });
      }
      
      if (options.types && options.types.length > 0) {
        shows = filterByType(shows, options.types);
      }
      
      if (options.networks && options.networks.length > 0) {
        shows = filterByNetwork(shows, options.networks);
      }
      
      if (options.genres && options.genres.length > 0) {
        shows = filterByGenre(shows, options.genres);
      }
      
      if (options.languages && options.languages.length > 0) {
        shows = filterByLanguage(shows, options.languages);
      }
      
      return shows;
    } catch (error) {
      console.error('Error fetching shows by date:', error);
      return [];
    }
  }

  /**
   * Get shows based on command line options
   * @param options - Command line options
   * @returns Promise resolving to an array of shows
   */
  async getShows(options: { 
    date?: string; 
    search?: string;
  }): Promise<Show[]> {
    // Search for shows by name
    if (options.search !== undefined && options.search !== null && options.search.trim() !== '') {
      return this.searchShows(options.search);
    }
    
    // Get shows for a specific date
    return this.fetchShowsWithOptions({
      date: options.date,
      country: undefined,
      types: undefined,
      networks: undefined,
      genres: undefined,
      languages: undefined
    });
  }
}
