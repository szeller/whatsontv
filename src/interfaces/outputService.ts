import type { Show } from '../types/tvShowModel.js';

/**
 * Interface for output services that display TV show information
 */
export interface OutputService {
  /**
   * Display TV shows to the user
   * @param shows List of shows to display
   * @param groupByNetwork Whether to group shows by network (default: true)
   */
  displayShows(shows: Show[], groupByNetwork?: boolean): Promise<void>;
  
  /**
   * Check if the service is properly initialized
   * @returns True if initialized, false otherwise
   */
  isInitialized(): boolean;
  
  /**
   * Display application header
   */
  displayHeader(): void;
  
  /**
   * Display application footer
   */
  displayFooter(): void;
}
