import type { Show } from '../schemas/domain.js';

/**
 * Interface for output services that display TV show information
 * 
 * This interface provides a single method for rendering TV show data.
 * Implementations are responsible for handling all aspects of output
 * including headers, footers, and formatting based on their injected
 * configuration service.
 */
export interface OutputService {
  /**
   * Execute the complete output workflow: display header, shows data, and footer
   * Configuration options should be obtained from the injected ConfigService
   * 
   * @param shows List of shows to display
   */
  renderOutput(shows: Show[]): Promise<void>;
}
