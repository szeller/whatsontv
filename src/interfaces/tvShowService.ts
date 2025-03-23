/**
 * Interface for TV show service operations
 * Responsible for fetching TV show data from external APIs
 */
import type { Show } from '../types/tvmaze.js';

export interface TvShowService {
  /**
   * Fetch shows for a specific date
   * @param date Date in YYYY-MM-DD format
   * @returns Promise resolving to an array of shows
   */
  getShowsByDate(date: string): Promise<Show[]>;

  /**
   * Search for shows by name
   * @param query Search query
   * @returns Promise resolving to an array of shows
   */
  searchShows(query: string): Promise<Show[]>;

  /**
   * Get episodes for a specific show
   * @param showId ID of the show
   * @returns Promise resolving to an array of episodes
   */
  getEpisodes(showId: number): Promise<Show[]>;

  /**
   * Get shows based on command line options
   * @param options Command line options
   * @returns Promise resolving to an array of shows
   */
  getShows(options: { 
    date?: string; 
    search?: string; 
    show?: number;
  }): Promise<Show[]>;

  /**
   * Fetch shows with advanced filtering options
   * @param options Options for filtering shows
   * @returns Promise resolving to array of shows
   */
  fetchShowsWithOptions(options: {
    date?: string;
    country?: string;
    types?: string[];
    networks?: string[];
    genres?: string[];
    languages?: string[];
  }): Promise<Show[]>;
}
