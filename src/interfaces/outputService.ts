import type { Show } from '../types/tvShowModel.js';

/**
 * Interface for output services that display TV show information
 */
export interface OutputService {
  /**
   * Display TV shows to the user
   * @param shows List of shows to display
   * @param timeSort Whether to sort by time (true) or group by network (false)
   */
  displayShows(shows: Show[], timeSort?: boolean): Promise<void>;
  
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
