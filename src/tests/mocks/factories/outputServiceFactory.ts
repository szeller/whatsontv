/**
 * Factory for creating mock OutputService instances
 */
import { jest } from '@jest/globals';
import type { OutputService } from '../../../interfaces/outputService.js';
import type { Show } from '../../../schemas/domain.js';
import { MockOptions } from './types.js';

/**
 * Options for creating a mock output service
 */
export interface OutputServiceOptions extends MockOptions<OutputService> {
  /** Error to throw when renderOutput is called */
  renderError?: Error;
  
  /** Custom callback to execute when renderOutput is called */
  onRenderOutput?: (shows: Show[]) => void;
  
  /** Whether to log show information to console in the default implementation */
  logToConsole?: boolean;
  
  /** Whether this is a verbose output, showing more details */
  verbose?: boolean;
}

/**
 * Creates a mock output service for testing
 * 
 * The default implementation will:
 * - Log a message with the number of shows (if logToConsole=true)
 * - Include additional details about shows if verbose=true
 * - Throw an error if renderError is provided
 * - Call onRenderOutput if provided
 * 
 * @param options Options for configuring the mock
 * @returns A mock output service instance
 */
export function createMockOutputService(
  options: OutputServiceOptions = {}
): jest.Mocked<OutputService> {
  const mockOutputService: jest.Mocked<OutputService> = {
    // eslint-disable-next-line @typescript-eslint/require-await -- mock returns Promise
    renderOutput: jest.fn(async (shows: Show[]): Promise<void> => {
      // If we should throw an error, do so
      if (options.renderError) {
        throw options.renderError;
      }

      // If a custom callback is provided, execute it
      if (options.onRenderOutput) {
        options.onRenderOutput(shows);
      } else if (options.logToConsole === true) {
        // Provide a more realistic default behavior that logs to console
        console.log(`[MockOutput] Displaying ${shows.length} shows`);

        // If verbose, log some details about the shows
        if (options.verbose === true && shows.length > 0) {
          for (const show of shows) {
            const hasAirtime = show.airtime !== null &&
              show.airtime !== '';

            const airtime = hasAirtime ? show.airtime : 'No airtime';
            console.log(`  - ${show.name} [${show.network}] ${airtime}`);
          }
        }
      }
    })
  };
  
  // Apply any custom implementations
  if (options.implementation) {
    for (const [key, value] of Object.entries(options.implementation)) {
      // We need to cast here because we're dynamically setting properties
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockOutputService as any)[key] = value;
    }
  }
  
  return mockOutputService;
}
