/**
 * Implementation of the TvShowService interface for the TVMaze API
 */
import 'reflect-metadata';
import { injectable, inject } from 'tsyringe';

// Type imports
import type { TvShowService } from '../interfaces/tvShowService.js';
import type { NetworkGroups } from '../types/app.js';
import type { Show, ShowDetails, Episode, TVMazeShow } from '../types/tvmaze.js';
import type { HttpClient } from '../utils/httpClient.js';
import { 
  getTodayDate, 
  groupShowsByNetwork, 
  sortShowsByTime, 
  formatTime, 
  normalizeShowData,
  filterByType,
  filterByNetwork,
  filterByGenre,
  filterByLanguage
} from '../utils/showUtils.js';

// Constants
const TVMAZE_API = 'https://api.tvmaze.com';

/**
 * Implementation of the TvShowService interface for the TVMaze API
 */
@injectable()
export class TvMazeService implements TvShowService {
  private _apiClient: HttpClient;

  constructor(@inject('HttpClient') httpClient: HttpClient) {
    this._apiClient = httpClient;
  }

  /**
   * Get shows for a specific date
   * @param date - Date in YYYY-MM-DD format
   * @returns Promise resolving to an array of shows
   */
  public async getShowsByDate(date: string): Promise<Show[]> {
    try {
      const response = await this._apiClient.get<Show[]>(`${TVMAZE_API}/schedule?date=${date}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching shows for date ${date}:`, error);
      return [];
    }
  }

  /**
   * Search for shows by name
   * @param query - Search query
   * @returns Promise resolving to an array of shows
   */
  public async searchShows(query: string): Promise<Show[]> {
    try {
      const response = await this._apiClient.get<
        Array<{ show: Partial<ShowDetails> }>
      >(
        `${TVMAZE_API}/search/shows?q=${encodeURIComponent(query)}`
      );
      return response.data.map(item => ({
        name: item.show.name !== undefined && item.show.name !== null && item.show.name !== '' ? 
          item.show.name : '',
        season: 0,
        number: 0,
        airtime: '',
        show: {
          id: item.show.id,
          name: item.show.name !== undefined && item.show.name !== null && item.show.name !== '' ? 
            item.show.name : '',
          type: item.show.type !== undefined && item.show.type !== null && item.show.type !== '' ? 
            item.show.type : '',
          language: item.show.language !== undefined && item.show.language !== null && 
            item.show.language !== '' ? item.show.language : '',
          genres: item.show.genres !== undefined && item.show.genres !== null ? 
            item.show.genres : [],
          network: item.show.network !== undefined && item.show.network !== null ? 
            item.show.network : null,
          webChannel: item.show.webChannel !== undefined && item.show.webChannel !== null ? 
            item.show.webChannel : null,
          image: item.show.image !== undefined && item.show.image !== null ? 
            item.show.image : null,
          summary: item.show.summary !== undefined && item.show.summary !== null && 
            item.show.summary !== '' ? item.show.summary : ''
        }
      }));
    } catch (error) {
      console.error(`Error searching for shows with query "${query}":`, error);
      return [];
    }
  }

  /**
   * Get episodes for a specific show
   * @param showId - ID of the show
   * @returns Promise resolving to an array of episodes
   */
  public async getEpisodes(showId: number): Promise<Show[]> {
    try {
      const response = await this._apiClient.get<Episode[]>(
        `${TVMAZE_API}/shows/${showId}/episodes`
      );
      return response.data.map(episode => ({
        name: episode.name !== undefined && episode.name !== null && episode.name !== '' ? 
          episode.name : '',
        season: episode.season !== undefined && episode.season !== null ? 
          episode.season : 0,
        number: episode.number !== undefined && episode.number !== null ? 
          episode.number : 0,
        airtime: episode.airtime !== undefined && episode.airtime !== null && 
          episode.airtime !== '' ? episode.airtime : '',
        show: {
          name: '',
          type: '',
          language: '',
          genres: [],
          network: null,
          webChannel: null,
          image: null,
          summary: ''
        }
      }));
    } catch (error) {
      console.error(`Error fetching episodes for show ${showId}:`, error);
      return [];
    }
  }

  /**
   * Fetch shows with advanced filtering options
   * @param options - Options for filtering shows
   * @returns Promise resolving to array of shows
   */
  public async fetchShowsWithOptions(options: {
    date?: string;
    country?: string;
    types?: string[];
    networks?: string[];
    genres?: string[];
    languages?: string[];
  }): Promise<Show[]> {
    try {
      // Set default date to today if not provided
      const date = options.date !== undefined && options.date !== null && options.date !== '' ? 
        options.date : getTodayDate();
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('date', date);
      
      if (options.country !== undefined && options.country !== null && options.country !== '') {
        params.append('country', options.country);
      }
      
      // Fetch schedule from API
      const response = await this._apiClient.get<Show[]>(
        `${TVMAZE_API}/schedule?${params.toString()}`
      );
      
      // Apply filters if provided
      let filteredShows = response.data;
      
      if (options.types !== undefined && options.types !== null && options.types.length > 0) {
        filteredShows = filterByType(filteredShows, options.types);
      }
      
      if (
        options.networks !== undefined && 
        options.networks !== null && 
        options.networks.length > 0
      ) {
        filteredShows = filterByNetwork(filteredShows, options.networks);
      }
      
      if (
        options.genres !== undefined && 
        options.genres !== null && 
        options.genres.length > 0
      ) {
        filteredShows = filterByGenre(filteredShows, options.genres);
      }
      
      if (
        options.languages !== undefined && 
        options.languages !== null && 
        options.languages.length > 0
      ) {
        filteredShows = filterByLanguage(filteredShows, options.languages);
      }
      
      return filteredShows;
    } catch (error) {
      console.error('Error fetching shows with options:', error);
      return [];
    }
  }

  /**
   * Get shows based on command line options
   * @param options - Command line options
   * @returns Promise resolving to an array of shows
   */
  public async getShows(options: { 
    date?: string; 
    search?: string; 
    show?: number;
  } = {}): Promise<Show[]> {
    if (
      options.search !== undefined && 
      options.search !== null && 
      options.search !== ''
    ) {
      return this.searchShows(options.search);
    } else if (
      options.show !== undefined && 
      options.show !== null && 
      options.show !== 0
    ) {
      return this.getEpisodes(options.show);
    } else {
      const date = options.date !== undefined && 
        options.date !== null && 
        options.date !== '' ? 
        options.date : getTodayDate();
      return this.getShowsByDate(date);
    }
  }

  /**
   * Get details for a specific show
   * @param showId - ID of the show
   * @returns Promise resolving to a show or null
   */
  public async getShowDetails(showId: string | number): Promise<ShowDetails | null> {
    try {
      const response = await this._apiClient.get<ShowDetails>(`${TVMAZE_API}/shows/${showId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching show details for ID ${showId}:`, error);
      return null;
    }
  }

  /**
   * Group shows by network
   * @param shows - Array of shows to group
   * @returns Object with networks as keys and arrays of shows as values
   */
  public groupShowsByNetwork(shows: Show[]): NetworkGroups {
    return groupShowsByNetwork(shows);
  }

  /**
   * Format time string to 12-hour format
   * @param time - Time string in HH:MM format
   * @returns Formatted time string
   */
  public formatTime(time: string | undefined): string {
    return formatTime(time);
  }

  /**
   * Sort shows by airtime
   * @param shows - Array of shows to sort
   * @returns Sorted array of shows
   */
  public sortShowsByTime(shows: Show[]): Show[] {
    return sortShowsByTime(shows);
  }
  
  /**
   * Normalize show data to a consistent format
   * @param show - Show data to normalize
   * @returns Normalized show data
   */
  public normalizeShowData(show: Partial<TVMazeShow>): Show {
    return normalizeShowData(show);
  }
}
