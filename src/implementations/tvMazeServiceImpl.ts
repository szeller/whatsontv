/**
 * Implementation of the TvShowService interface for the TVMaze API
 */
import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';

// Type imports
import type { TvShowService } from '../interfaces/tvShowService.js';
import type { NetworkGroups } from '../types/app.js';
import type { Episode, Show, ShowDetails, TVMazeShow } from '../types/tvmaze.js';
import type { HttpClient } from '../interfaces/httpClient.js';
import { 
  filterByGenre, 
  filterByLanguage, 
  filterByNetwork, 
  filterByType, 
  formatTime as formatTimeUtil,
  getTodayDate,
  groupShowsByNetwork as groupShowsByNetworkUtil,
  normalizeShowData,
  sortShowsByTime as sortShowsByTimeUtil
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
      const response = await this._apiClient.get<TVMazeShow[]>(
        `${TV_MAZE_API}/schedule?date=${date}`
      );

      // Check if data exists and has length
      if (Array.isArray(response.data) && response.data.length === 0) {
        console.error(`Error fetching shows for date ${date}: ${NO_DATA_MESSAGE}`);
        return [];
      }

      // Transform the API response to our Show type
      return response.data.map(show => normalizeShowData(show));
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
   * Get episodes for a specific show
   * @param showId - ID of the show
   * @returns Promise resolving to an array of episodes as shows
   */
  async getEpisodes(showId: number): Promise<Show[]> {
    try {
      const response = await this._apiClient.get<Episode[]>(
        `${TV_MAZE_API}/shows/${showId}/episodes`
      );

      // Check if data exists and has length
      if (Array.isArray(response.data) && response.data.length === 0) {
        console.error(`Error fetching episodes for show ${showId}: ${NO_DATA_MESSAGE}`);
        return [];
      }

      // First get the show details to use in the episode mapping
      const showDetails = await this.getShowDetails(showId);
      if (showDetails === null) {
        console.error(`Unable to fetch show details for show ${showId}`);
        return [];
      }
      
      // Convert episodes to Show format
      return response.data.map(episode => {
        // Handle nullable values explicitly
        const airdate = episode.airdate ?? '';
        const runtime = episode.runtime ?? 0;
        const summary = episode.summary ?? '';
        
        return {
          id: episode.id,
          name: episode.name,
          airdate,
          airtime: episode.airtime,
          runtime,
          season: episode.season,
          number: episode.number,
          show: {
            id: showId,
            name: showDetails.name,
            type: 'episode',
            language: showDetails.language,
            genres: showDetails.genres,
            network: showDetails.network,
            webChannel: showDetails.webChannel,
            image: showDetails.image,
            summary: showDetails.summary
          },
          network: showDetails.network,
          summary
        };
      });
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
    show?: number;
    country?: string;
    types?: string[];
    networks?: string[];
    genres?: string[];
    languages?: string[];
  } = {}): Promise<Show[]> {
    // Search for shows by name
    if (options.search !== undefined && options.search !== null && options.search.trim() !== '') {
      return this.searchShows(options.search);
    }
    
    // Get episodes for a specific show
    if (typeof options.show === 'number' && options.show > 0) {
      return this.getEpisodes(options.show);
    }
    
    // Get shows for a specific date with filters
    return this.fetchShowsWithOptions(options);
  }

  /**
   * Get details for a specific show
   * @param showId - ID of the show
   * @returns Promise resolving to a show or null
   */
  async getShowDetails(showId: string | number): Promise<ShowDetails | null> {
    try {
      const response = await this._apiClient.get<ShowDetails>(
        `${TV_MAZE_API}/shows/${showId}`
      );

      // Check if data exists
      const hasData = response.data !== undefined && response.data !== null;
      if (!hasData) {
        console.error(`Error fetching show details for ${showId}: ${NO_DATA_MESSAGE}`);
        return null;
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching show details for ${showId}:`, error);
      return null;
    }
  }

  /**
   * Group shows by network
   * @param shows - Array of shows to group
   * @returns Object with network names as keys and arrays of shows as values
   */
  groupShowsByNetwork(shows: Show[]): NetworkGroups {
    return groupShowsByNetworkUtil(shows);
  }

  /**
   * Format time string to 12-hour format
   * @param time - Time string in HH:MM format
   * @returns Formatted time string
   */
  formatTime(time: string | undefined): string {
    return formatTimeUtil(time);
  }

  /**
   * Sort shows by airtime
   * @param shows - Array of shows to sort
   * @returns Sorted array of shows
   */
  sortShowsByTime(shows: Show[]): Show[] {
    return sortShowsByTimeUtil(shows);
  }
}
