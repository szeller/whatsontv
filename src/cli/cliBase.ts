/**
 * Base CLI application functionality
 */
import type { ProcessOutput } from '../interfaces/processOutput.js';
import type { TvShowService } from '../interfaces/tvShowService.js';
import type { ConfigService } from '../interfaces/configService.js';
import type { Show } from '../schemas/domain.js';
import { formatError, handleMainError, isDirectExecution } from '../utils/errorHandling.js';
import { OutputService } from '../interfaces/outputService.js';

/**
 * Base CLI application class with common functionality
 */
export class BaseCliApplication {
  /**
   * Create a new BaseCliApplication
   * @param tvShowService Service for fetching TV shows
   * @param configService Service for configuration
   * @param processOutput Service for process output
   */
  constructor(
    protected readonly tvShowService: TvShowService,
    protected readonly configService: ConfigService,
    protected readonly processOutput: ProcessOutput,
    protected readonly outputService: OutputService
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
        this.processOutput.error(`Error fetching TV shows: ${formatError(err)}`);
      }
    } catch (err) {
      this.processOutput.error(`Unexpected error: ${formatError(err)}`);
    }
  }
  
  /**
   * Process the fetched shows
   * @param shows The shows to process
   */
  protected async processShows(shows: Show[]): Promise<void> {
    // Let the OutputService handle all rendering aspects
    await this.outputService.renderOutput(shows);
  }
}

/**
 * Run the main function if this file is executed directly
 * @param appFactory Factory function to create a CLI application instance
 * @param processOutput Process output service for logging
 */
export function runMain(appFactory: () => BaseCliApplication, processOutput: ProcessOutput): void {
  if (isDirectExecution()) {
    appFactory().run().catch((error) => handleMainError(error, processOutput));
  }
}
