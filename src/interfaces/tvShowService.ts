/**
 * Interface for services that fetch TV show information
 */
import type { Show } from '../schemas/domain.js';
import type { ShowOptions } from '../types/tvShowOptions.js';

export interface TvShowService {
  /**
   * Fetch shows with filtering options
   * @param options Options for filtering shows
   * @returns Promise resolving to array of shows
   */
  fetchShows(options: ShowOptions): Promise<Show[]>;
}
