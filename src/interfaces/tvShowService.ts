/**
 * Interface for TV show service operations
 * Responsible for fetching TV show data from external APIs
 */
import type { Show } from '../types/tvShowModel.js';

export interface TvShowService {
  /**
   * Fetch shows for a specific date
   * @param date Date in YYYY-MM-DD format
   * @returns Promise resolving to an array of shows
   */
  getShowsByDate(date: string): Promise<Show[]>;

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
