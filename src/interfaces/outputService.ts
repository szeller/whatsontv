import type { CliArgs } from '../services/consoleOutputService.js';
import type { Show } from '../types/tvmaze.js';

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
   * Parse command line arguments
   * @param args Command line arguments
   * @returns Parsed arguments object
   */
  parseArgs(args?: string[]): CliArgs;
  
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
