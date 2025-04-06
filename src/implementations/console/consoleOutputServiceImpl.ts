import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';

import type { ConfigService } from '../../interfaces/configService.js';
import type { TextShowFormatter } from '../../interfaces/showFormatter.js';
import type { Show } from '../../schemas/domain.js';
import type { OutputService } from '../../interfaces/outputService.js';
import type { ConsoleOutput } from '../../interfaces/consoleOutput.js';
import { groupShowsByNetwork, sortShowsByTime } from '../../utils/showUtils.js';
import { padString } from '../../utils/stringUtils.js';

/**
 * Console output service for displaying TV show information
 * Implements the OutputService interface
 */
@injectable()
export class ConsoleOutputServiceImpl implements OutputService {
  protected formatter!: TextShowFormatter;
  protected output!: ConsoleOutput;
  protected configService!: ConfigService;

  /**
   * Create a new ConsoleOutputService
   * @param formatter Formatter for TV show output
   * @param output Console output utility
   * @param configService Configuration service
   * @param skipInitialization Optional flag to skip initialization (for testing)
   */
  constructor(
    @inject('TextShowFormatter') formatter: TextShowFormatter,
    @inject('ConsoleOutput') output: ConsoleOutput,
    @inject('ConfigService') configService: ConfigService,
      skipInitialization = false
  ) {
    if (!skipInitialization) {
      this.initialize(formatter, output, configService);
    }
  }

  /**
   * Initialize the service with dependencies
   * This method is separated from the constructor to allow overriding in tests
   * @param formatter Formatter for TV show output
   * @param output Console output utility
   * @param configService Configuration service
   * @protected
   */
  protected initialize(
    formatter: TextShowFormatter,
    output: ConsoleOutput,
    configService: ConfigService
  ): void {
    this.formatter = formatter;
    this.output = output;
    this.configService = configService;
  }

  /**
   * Execute the complete output workflow: display header, shows data, and footer
   * @param shows Array of TV shows to display
   * @returns Promise that resolves when output is complete
   */
  public async renderOutput(shows: Show[]): Promise<void> {
    // Get config options directly from the injected ConfigService
    const cliOptions = this.configService.getCliOptions();
    const groupByNetwork = cliOptions.groupByNetwork ?? true;
    const debug = cliOptions.debug ?? false;
    
    // Display header
    this.displayHeader();
    
    // Show debug info if needed
    if (debug) {
      this.displayDebugInfo(shows);
    }
    
    // Display shows data
    await this.displayShowsData(shows, groupByNetwork);
    
    // Display footer
    this.displayFooter();
  }

  /**
   * Display TV shows based on the groupByNetwork option
   * @param shows Array of TV shows to display
   * @param groupByNetwork Whether to group shows by network
   * @returns Promise that resolves when shows are displayed
   * @private
   */
  private async displayShowsData(shows: Show[], groupByNetwork: boolean): Promise<void> {
    if (shows.length === 0) {
      this.output.log('No shows found for the specified criteria.');
      return;
    }

    // Always sort shows by time first using the shared utility
    const sortedShows = sortShowsByTime(shows);
    
    // Group shows by network if requested
    const networkGroups = groupByNetwork 
      ? groupShowsByNetwork(sortedShows) 
      : { 'All Shows': sortedShows };
    
    try {
      // Format the shows using the new interface
      const formattedOutput = this.formatter.formatNetworkGroups(networkGroups);
      
      // Display each line of output
      for (const line of formattedOutput) {
        await Promise.resolve(this.output.log(line));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.output.error(`Error displaying output: ${errorMessage}`);
    }
  }

  /**
   * Display application header
   * @private
   */
  private displayHeader(): void {
    // Use package version (hardcoded for now, could be imported from package.json)
    const version = '1.0.0';
    
    // Create a header with app name and version using string utilities
    const appHeader = `WhatsOnTV v${version}`;
    const separator = this.createSeparator();
    
    // Display header
    this.output.log('');
    this.output.log(appHeader);
    this.output.log(separator);
  }
  
  /**
   * Display application footer
   * @private
   */
  private displayFooter(): void {
    const separator = this.createSeparator();
    
    // Display footer
    this.output.log('');
    this.output.log(separator);
    this.output.log('Data provided by TVMaze API (https://api.tvmaze.com)');
  }

  /**
   * Display debug information about shows
   * @param shows Array of TV shows
   * @private
   */
  private displayDebugInfo(shows: Show[]): void {
    const uniqueNetworks = new Set<string>();
    
    for (const show of shows) {
      if (show.network && typeof show.network === 'string') {
        uniqueNetworks.add(show.network);
      }
    }
    
    this.output.log('\nAvailable Networks:');
    this.output.log([...uniqueNetworks].sort().join(', '));
    this.output.log(`\nTotal Shows: ${shows.length}`);
  }

  /**
   * Create a separator line with consistent length
   * @returns Formatted separator string
   * @private
   */
  private createSeparator(length: number = 30, char: string = '='): string {
    return padString('', length, char);
  }
}
