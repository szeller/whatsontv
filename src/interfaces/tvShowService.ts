/**
 * Interface for TV show service operations
 * Responsible for fetching TV show data from external APIs
 */
import type { Show } from '../types/tvShowModel.js';
import type { ShowOptions } from '../types/tvShowOptions.js';

export interface TvShowService {
  /**
   * Fetch shows with filtering options
   * @param options Options for filtering shows
   * @returns Promise resolving to array of shows
   */
  fetchShows(options: ShowOptions): Promise<Show[]>;
}
