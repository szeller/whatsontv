import 'reflect-metadata';
import { injectable, inject } from 'tsyringe';

// Type imports
import type { TvShowService } from '../interfaces/tvShowService.js';
import type { NetworkGroups } from '../types/app.js';
import type { Show, ShowDetails, Episode, TVMazeShow } from '../types/tvmaze.js';
import type { HttpClient, HttpResponse } from '../utils/httpClient.js';

// Constants
const TVMAZE_API = 'https://api.tvmaze.com';

/**
 * Get today's date in YYYY-MM-DD format
 * @returns Today's date string
 */
export function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Group shows by their network
 * @param shows - Array of shows to group
 * @returns Object with network names as keys and arrays of shows as values
 */
export function groupShowsByNetwork(shows: Show[]): NetworkGroups {
  const groups: NetworkGroups = {};
  
  for (const show of shows) {
    const networkName = show.show.network?.name !== undefined && 
                         show.show.network?.name !== null ? 
      show.show.network.name : 'Unknown';
      
    // Use Object.prototype.hasOwnProperty to safely check property existence
    if (!Object.prototype.hasOwnProperty.call(groups, networkName)) {
      groups[networkName] = [];
    }
      
    // Safe access after checking property existence
    if (Object.prototype.hasOwnProperty.call(groups, networkName)) {
      groups[networkName].push(show);
    }
  }
  
  return groups;
}

/**
 * Sort shows by their airtime
 * @param shows - Array of shows to sort
 * @returns Sorted array of shows
 */
export function sortShowsByTime(shows: Show[]): Show[] {
  return [...shows].sort((a, b) => {
    // Handle cases where airtime is missing
    if (!a.airtime && !b.airtime) return 0;
    if (!a.airtime) return 1;
    if (!b.airtime) return -1;

    // Convert airtime to minutes for comparison
    const getMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    return getMinutes(a.airtime) - getMinutes(b.airtime);
  });
}

/**
 * Implementation of the TvShowService interface
 * Provides methods for fetching and manipulating TV show data
 */
@injectable()
export class TvShowServiceImpl implements TvShowService {
  private _apiClient: HttpClient;
  
  /**
   * Create a new TvShowServiceImpl
   * @param httpClient HTTP client for API requests
   */
  constructor(@inject('HttpClient') private httpClient: HttpClient) {
    this._apiClient = httpClient;
  }
  
  /**
   * Set the API client instance (for testing)
   * @param client The client to use
   */
  public setApiClient(client: HttpClient): void {
    this._apiClient = client;
  }
  
  /**
   * Get the API client instance
   * @returns The current API client
   */
  private _getApiClient(): HttpClient {
    return this._apiClient;
  }
  
  /**
   * Format time string to a consistent format
   * @param time Time string to format
   * @returns Formatted time string
   */
  public formatTime(time: string | undefined): string {
    if (time === undefined || time === null || time === '') {
      return 'TBA';
    }
    
    try {
      // Parse the time string (expected format: HH:MM)
      const [hours, minutes] = time.split(':').map(Number);
      
      // Validate that we have valid numbers
      if (isNaN(hours) || isNaN(minutes)) {
        return 'TBA';
      }
      
      // Convert to 12-hour format
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
      
      // Format as "h:MM AM/PM"
      return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (_error) {
      // Return TBA if parsing fails
      return 'TBA';
    }
  }

  /**
   * Get today's date in YYYY-MM-DD format
   * @returns Today's date string
   */
  public getTodayDate(): string {
    return getTodayDate();
  }
  
  /**
   * Group shows by network
   * @param shows Shows to group
   * @returns Shows grouped by network
   */
  public groupShowsByNetwork(shows: Show[]): NetworkGroups {
    return groupShowsByNetwork(shows);
  }
  
  /**
   * Sort shows by airtime
   * @param shows Shows to sort
   * @returns Sorted shows
   */
  public sortShowsByTime(shows: Show[]): Show[] {
    return sortShowsByTime(shows);
  }

  /**
   * Filter shows by type
   * @param shows Shows to filter
   * @param types Types to include
   * @returns Filtered shows
   */
  private filterByType(shows: Show[], types: string[]): Show[] {
    if (!types.length) {
      return shows;
    }
    
    return shows.filter(show => {
      const showType = show.show.type;
      return showType !== undefined && showType !== null && types.includes(showType);
    });
  }
  
  /**
   * Filter shows by network
   * @param shows Shows to filter
   * @param networks Networks to include
   * @returns Filtered shows
   */
  private filterByNetwork(shows: Show[], networks: string[]): Show[] {
    if (!networks.length) {
      return shows;
    }
    
    return shows.filter(show => {
      const networkName = show.show.network?.name;
      return networkName !== undefined && networkName !== null && networks.includes(networkName);
    });
  }
  
  /**
   * Filter shows by genre
   * @param shows Shows to filter
   * @param genres Genres to include
   * @returns Filtered shows
   */
  private filterByGenre(shows: Show[], genres: string[]): Show[] {
    if (!genres.length) {
      return shows;
    }
    
    return shows.filter(show => {
      const showGenres = show.show.genres;
      return showGenres !== undefined && showGenres !== null && 
        showGenres.some(genre => genres.includes(genre));
    });
  }
  
  /**
   * Filter shows by language
   * @param shows Shows to filter
   * @param languages Languages to include
   * @returns Filtered shows
   */
  private filterByLanguage(shows: Show[], languages: string[]): Show[] {
    if (!languages.length) {
      return shows;
    }
    
    return shows.filter(show => {
      const language = show.show.language;
      return language !== undefined && language !== null && languages.includes(language);
    });
  }

  /**
   * Fetch shows with advanced filtering options
   * @param options Options for filtering shows
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
        options.date : this.getTodayDate();
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('date', date);
      
      if (options.country !== undefined && options.country !== null && options.country !== '') {
        params.append('country', options.country);
      }
      
      // Fetch schedule from API
      const response: HttpResponse<Show[]> = await this._getApiClient().get(
        `${TVMAZE_API}/schedule?${params.toString()}`
      );
      
      // Apply filters if provided
      let filteredShows = response.data;
      
      if (options.types && options.types.length > 0) {
        filteredShows = this.filterByType(filteredShows, options.types);
      }
      
      if (options.networks && options.networks.length > 0) {
        filteredShows = this.filterByNetwork(filteredShows, options.networks);
      }
      
      if (options.genres && options.genres.length > 0) {
        filteredShows = this.filterByGenre(filteredShows, options.genres);
      }
      
      if (options.languages && options.languages.length > 0) {
        filteredShows = this.filterByLanguage(filteredShows, options.languages);
      }
      
      return filteredShows;
    } catch (error) {
      console.error('Error fetching shows by date:', error);
      return [];
    }
  }

  /**
   * Fetch shows for a specific date
   * @param date Date in YYYY-MM-DD format
   * @returns Promise resolving to an array of shows
   */
  public async getShowsByDate(date: string): Promise<Show[]> {
    try {
      const response = await this._getApiClient().get<Show[]>(
        `${TVMAZE_API}/schedule?date=${date}`
      );
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
      const response = await this._getApiClient().get<Array<{ show: Partial<ShowDetails> }>>(
        `${TVMAZE_API}/search/shows?q=${encodeURIComponent(query)}`
      );
      
      // Convert search results to Show format
      return response.data.map(item => {
        // Create a properly typed ShowDetails object
        const showDetails: ShowDetails = {
          id: item.show.id !== undefined ? item.show.id : 0,
          name: item.show.name !== undefined && item.show.name !== null ? 
            item.show.name : '',
          type: item.show.type !== undefined && item.show.type !== null ? 
            item.show.type : '',
          language: item.show.language !== undefined ? item.show.language : null,
          genres: item.show.genres !== undefined && item.show.genres !== null ? 
            item.show.genres : [],
          network: item.show.network !== undefined ? item.show.network : null,
          webChannel: item.show.webChannel !== undefined ? item.show.webChannel : null,
          image: item.show.image !== undefined ? item.show.image : null,
          summary: item.show.summary !== undefined && item.show.summary !== null ? 
            item.show.summary : ''
        };
        
        // Return a properly typed Show object
        return {
          name: item.show.name !== undefined && item.show.name !== null && item.show.name !== '' ? 
            item.show.name : '',
          season: 0,
          number: 0,
          airtime: '',
          show: showDetails
        };
      });
    } catch (error) {
      console.error(`Error searching for shows with query "${query}":`, error);
      return [];
    }
  }

  /**
   * Get episodes for a specific show
   * @param showId ID of the show
   * @returns Promise resolving to an array of episodes
   */
  public async getEpisodes(showId: number): Promise<Show[]> {
    try {
      const response = await this._getApiClient().get<Episode[]>(
        `${TVMAZE_API}/shows/${showId}/episodes`
      );
      
      // Convert episodes to Show format
      return response.data.map(episode => {
        // Create a properly typed ShowDetails object for the parent show
        const showDetails: ShowDetails = {
          id: showId,
          name: '',
          type: '',
          language: null,
          genres: [],
          network: null,
          webChannel: null,
          image: null,
          summary: ''
        };

        // Return a properly typed Show object
        return {
          name: episode.name !== undefined && episode.name !== null && episode.name !== '' ? 
            episode.name : '',
          season: episode.season !== undefined && episode.season !== null ? 
            episode.season : 0,
          number: episode.number !== undefined && episode.number !== null ? 
            episode.number : 0,
          airtime: episode.airtime !== undefined && episode.airtime !== null && 
            episode.airtime !== '' ? episode.airtime : '',
          show: showDetails
        };
      });
    } catch (error) {
      console.error(`Error fetching episodes for show ${showId}:`, error);
      return [];
    }
  }

  /**
   * Get shows based on command line options
   * @param options Command line options
   * @returns Promise resolving to an array of shows
   */
  public async getShows(options: { 
    date?: string; 
    search?: string; 
    show?: number;
  }): Promise<Show[]> {
    // If search is provided, search for shows
    if (
      options.search !== undefined && 
      options.search !== null && 
      options.search !== ''
    ) {
      return this.searchShows(options.search);
    }
    
    // If show ID is provided, get episodes for that show
    if (
      options.show !== undefined && 
      options.show !== null && 
      options.show !== 0
    ) {
      return this.getEpisodes(options.show);
    }
    
    // Otherwise, get shows for the specified date (or today)
    const date = options.date !== undefined && 
      options.date !== null && 
      options.date !== '' ? 
      options.date : this.getTodayDate();
    return this.getShowsByDate(date);
  }

  /**
   * Get details for a specific show
   * @param showId ID of the show
   * @returns Promise resolving to a show or null if not found
   */
  public async getShowDetails(showId: number): Promise<Show | null> {
    try {
      const response = await this._getApiClient().get<ShowDetails>(
        `${TVMAZE_API}/shows/${showId}`
      );
      
      return {
        name: '',
        season: 0,
        number: 0,
        airtime: '',
        show: response.data
      };
    } catch (error) {
      console.error(`Error fetching details for show ${showId}:`, error);
      return null;
    }
  }

  /**
   * Normalize show data to ensure consistent format
   * @param show Raw show data
   * @returns Normalized show data
   */
  public normalizeShowData(show: Partial<TVMazeShow>): Show {
    // Create a properly typed ShowDetails object
    const showDetails: ShowDetails = {
      id: show.id !== undefined && show.id !== null ? show.id : 0,
      name: show.name !== undefined && show.name !== null && show.name !== '' ? 
        show.name : '',
      type: show.type !== undefined && show.type !== null && show.type !== '' ? 
        show.type : '',
      language: show.language !== undefined ? show.language : null,
      genres: show.genres !== undefined && show.genres !== null ? 
        show.genres : [],
      network: show.network !== undefined ? show.network : null,
      webChannel: show.webChannel !== undefined ? show.webChannel : null,
      image: show.image !== undefined ? show.image : null,
      summary: show.summary !== undefined && show.summary !== null && 
        show.summary !== '' ? show.summary : ''
    };

    // Return a properly typed Show object
    return {
      name: show.name !== undefined && show.name !== null && show.name !== '' ? 
        show.name : '',
      season: show.season !== undefined && show.season !== null ? 
        Number(show.season) : 0,
      number: show.number !== undefined && show.number !== null ? 
        Number(show.number) : 0,
      airtime: show.airtime !== undefined && show.airtime !== null && 
        show.airtime !== '' ? show.airtime : '',
      show: show.show !== undefined && show.show !== null ? 
        show.show : showDetails
    };
  }
}
