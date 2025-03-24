/**
 * Implementation of the TvShowService interface for the TVMaze API
 */
import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';

// Type imports
import type { TvShowService } from '../interfaces/tvShowService.js';
import type { Show } from '../types/tvShowModel.js';
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
   * Get shows for a specific date from the traditional network schedule
   * @param date - Date in YYYY-MM-DD format
   * @returns Promise resolving to an array of raw schedule items
   * @private
   */
  private async getNetworkSchedule(date: string): Promise<unknown[]> {
    const endpoint = `${TV_MAZE_API}/schedule?date=${date}&country=US`;
    
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
    const endpoint = `${TV_MAZE_API}/schedule/web?date=${date}`;
    
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
        console.error('TvMazeServiceImpl.getWebSchedule error:', error);
      }
      
      return [];
    }
  }

  /**
   * Get shows for a specific date from both network and web schedules
   * @param date - Date in YYYY-MM-DD format
   * @returns Promise resolving to an array of shows
   */
  async getShowsByDate(date: string): Promise<Show[]> {
    try {
      // Fetch shows from both endpoints in parallel
      const [networkSchedule, webSchedule] = await Promise.all([
        this.getNetworkSchedule(date),
        this.getWebSchedule(date)
      ]);
      
      // Combine the results
      const combinedSchedule = [...networkSchedule, ...webSchedule];
      
      // If no data is returned from either endpoint, throw an error
      if (combinedSchedule.length === 0) {
        throw new Error(NO_DATA_MESSAGE);
      }
      
      // Transform the combined data using our domain model
      return transformSchedule(combinedSchedule);
    } catch (error) {
      // Only log errors in production environments, not during tests
      if (process.env.NODE_ENV !== 'test') {
        console.error('TvMazeServiceImpl.getShowsByDate error:', error);
      }
      
      // Return empty array instead of rethrowing
      return [];
    }
  }

  /**
   * Fetch shows with advanced filtering options
   * @param options Options for filtering shows
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
      // Get the date to fetch shows for
      const date = options.date !== undefined && options.date !== '' 
        ? options.date 
        : getTodayDate();
      
      // Fetch shows for the specified date
      let shows = await this.getShowsByDate(date);
      
      // Apply filters
      if (options.country !== undefined && options.country !== '') {
        shows = filterByCountry(shows, options.country);
      }
      
      if (options.types !== undefined && options.types.length > 0) {
        shows = filterByType(shows, options.types);
      }
      
      if (options.networks !== undefined && options.networks.length > 0) {
        shows = filterByNetwork(shows, options.networks);
      }
      
      if (options.genres !== undefined && options.genres.length > 0) {
        shows = filterByGenre(shows, options.genres);
      }
      
      if (options.languages !== undefined && options.languages.length > 0) {
        shows = filterByLanguage(shows, options.languages);
      }
      
      return shows;
    } catch (error) {
      // Only log errors in production environments, not during tests
      if (process.env.NODE_ENV !== 'test') {
        console.error('TvMazeServiceImpl.fetchShowsWithOptions error:', error);
      }
      
      // Return empty array instead of rethrowing
      return [];
    }
  }
}
