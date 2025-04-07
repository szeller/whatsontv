/**
 * Base CLI application functionality
 */
import type { ConsoleOutput } from '../interfaces/consoleOutput.js';
import type { TvShowService } from '../interfaces/tvShowService.js';
import type { ConfigService } from '../interfaces/configService.js';
import type { Show } from '../schemas/domain.js';
import { formatError, handleMainError, isDirectExecution } from './errorHandling.js';

/**
 * Base CLI application class with common functionality
 */
export abstract class BaseCliApplication {
  /**
   * Create a new BaseCliApplication
   * @param tvShowService Service for fetching TV shows
   * @param configService Service for configuration
   * @param consoleOutput Service for console output
   */
  constructor(
    protected readonly tvShowService: TvShowService,
    protected readonly configService: ConfigService,
    protected readonly consoleOutput: ConsoleOutput
  ) {}

  /**
   * Run the CLI application
   */
  public async run(): Promise<void> {
    try {
      // Get configuration options for fetching shows
      const showOptions = this.configService.getShowOptions();
      
      try {
        // Fetch TV shows
        const shows = await this.tvShowService.fetchShows(showOptions);
        
        // Process the shows
        await this.processShows(shows);
      } catch (err) {
        this.consoleOutput.error(`Error fetching TV shows: ${formatError(err)}`);
      }
    } catch (err) {
      this.consoleOutput.error(`Unexpected error: ${formatError(err)}`);
    }
  }
  
  /**
   * Process the fetched shows
   * @param shows The shows to process
   */
  protected abstract processShows(shows: Show[]): Promise<void>;
}

/**
 * Run the main function if this file is executed directly
 * @param app The CLI application instance to run
 * @param consoleOutput Console output service for logging
 */
export function runMain(app: BaseCliApplication, consoleOutput: ConsoleOutput): void {
  if (isDirectExecution()) {
    app.run().catch((error) => handleMainError(error, consoleOutput));
  }
}
