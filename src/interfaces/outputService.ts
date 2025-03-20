import type { Show } from '../types/tvmaze.js';

/**
 * Interface for output services that display TV show information
 */
export interface OutputService {
  /**
   * Display TV shows using this output service
   * @param shows Array of TV shows to display
   * @param timeSort Whether to sort shows by time
   * @returns Promise that resolves when shows are displayed
   */
  displayShows(shows: Show[], timeSort?: boolean): Promise<void>;
  
  /**
   * Check if the output service is properly initialized
   * @returns True if the service is ready to use
   */
  isInitialized(): boolean;
}
