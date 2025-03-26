import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';
import yargs from 'yargs';
import type { Arguments } from 'yargs';

import type { ConsoleOutput } from '../../interfaces/consoleOutput.js';
import type { OutputService } from '../../interfaces/outputService.js';
import type { ShowFormatter } from '../../interfaces/showFormatter.js';
import type { Show } from '../../types/tvShowModel.js';
import type { NetworkGroups } from '../../utils/showUtils.js';
import { groupShowsByNetwork } from '../../utils/showUtils.js';
import { getTodayDate } from '../../utils/dateUtils.js';
import type { ConfigService } from '../../interfaces/configService.js';

/**
 * CLI arguments interface for console output
 */
export interface ConsoleCliArgs extends Arguments {
  date: string;
  country: string;
  types: string[];
  networks: string[];
  genres: string[];
  languages: string[];
  query: string;
  slack: boolean;
  showId: number;
  limit: number;
  help: boolean;
  version: boolean;
  debug: boolean;
  fetch: 'network' | 'web' | 'all';
}

/**
 * Console output service for displaying TV show information
 * Implements the OutputService interface
 */
@injectable()
export class ConsoleOutputServiceImpl implements OutputService {
  protected formatter!: ShowFormatter;
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
    @inject('ShowFormatter') formatter: ShowFormatter,
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
    formatter: ShowFormatter,
    output: ConsoleOutput,
    configService: ConfigService
  ): void {
    this.formatter = formatter;
    this.output = output;
    this.configService = configService;
  }

  /**
   * Display TV shows based on the groupByNetwork option
   * @param shows Array of TV shows to display
   * @param groupByNetwork Whether to group shows by network (default: true)
   * @returns Promise that resolves when shows are displayed
   */
  public async displayShows(shows: Show[], groupByNetwork: boolean = true): Promise<void> {
    if (shows.length === 0) {
      this.output.log('No shows found for the specified criteria.');
      return;
    }

    // Always sort shows by time first
    const sortedShows = this.sortShowsByTime(shows);
    
    // Group shows by network if requested
    const networkGroups = groupByNetwork 
      ? this.groupShowsByNetwork(sortedShows) 
      : { 'All Shows': sortedShows };
    
    // Format the shows - pass the groupByNetwork value as timeSort
    // This maintains compatibility with existing tests
    const formattedOutput = this.formatter.formatNetworkGroups(networkGroups, groupByNetwork);

    // Display each line of output
    try {
      for (const line of formattedOutput) {
        await Promise.resolve(this.output.log(line));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.output.error(`Error displaying output: ${errorMessage}`);
    }
  }

  /**
   * Sort shows by airtime
   * @param shows Array of TV shows to sort
   * @returns Sorted array of shows
   * @private
   */
  private sortShowsByTime(shows: Show[]): Show[] {
    return [...shows].sort((a, b) => {
      // Handle shows without airtime
      if (a.airtime === undefined || a.airtime === null || a.airtime === '') {
        return 1;
      }
      if (b.airtime === undefined || b.airtime === null || b.airtime === '') {
        return -1;
      }
      
      // Convert airtime strings to minutes since midnight for proper comparison
      const getTimeInMinutes = (timeStr: string): number => {
        // Normalize the time format
        let hours = 0;
        let minutes = 0;
        
        // Handle various time formats
        if (timeStr.includes(':')) {
          // Format: "HH:MM" or "H:MM" with optional AM/PM
          const timeParts = timeStr.split(':');
          hours = parseInt(timeParts[0], 10);
          
          // Extract minutes, removing any AM/PM suffix
          const minutesPart = timeParts[1].replace(/\s*[APap][Mm].*$/, '');
          minutes = parseInt(minutesPart, 10);
          
          // Handle AM/PM if present
          const isPM = /\s*[Pp][Mm]/.test(timeStr);
          const isAM = /\s*[Aa][Mm]/.test(timeStr);
          
          if (isPM && hours < 12) {
            hours += 12;
          } else if (isAM && hours === 12) {
            hours = 0;
          }
        } else {
          // Format without colon, assume it's just hours
          hours = parseInt(timeStr, 10);
        }
        
        return hours * 60 + minutes;
      };
      
      const aMinutes = getTimeInMinutes(a.airtime);
      const bMinutes = getTimeInMinutes(b.airtime);
      
      return aMinutes - bMinutes;
    });
  }

  /**
   * Group shows by network
   * @param shows Array of TV shows to group
   * @returns Shows grouped by network
   * @protected
   */
  protected groupShowsByNetwork(shows: Show[]): NetworkGroups {
    return groupShowsByNetwork(shows);
  }

  /**
   * Display shows grouped by network
   * @param networkGroups Shows grouped by network
   * @param timeSort Whether to sort shows by time within each network
   */
  public async displayNetworkGroups(
    networkGroups: NetworkGroups,
    timeSort: boolean = false
  ): Promise<void> {
    const formattedOutput = this.formatter.formatNetworkGroups(
      networkGroups,
      timeSort
    );

    // Display each line of output
    try {
      for (const line of formattedOutput) {
        await Promise.resolve(this.output.log(line));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.output.error(`Error displaying output: ${errorMessage}`);
    }
  }

  /**
   * Check if the service is properly initialized
   * @returns True if the service is ready to use
   */
  public isInitialized(): boolean {
    return (
      this.output !== null &&
      this.output !== undefined &&
      this.formatter !== null &&
      this.formatter !== undefined &&
      this.configService !== null &&
      this.configService !== undefined
    );
  }

  /**
   * Parse command line arguments
   * @param args Command line arguments (optional)
   * @returns Parsed command line arguments
   */
  public parseArgs(args?: string[]): ConsoleCliArgs {
    return yargs(args || process.argv.slice(2))
      .options({
        date: {
          alias: 'd',
          describe: 'Date to show TV schedule for (YYYY-MM-DD)',
          type: 'string',
          default: getTodayDate()
        },
        country: {
          alias: 'c',
          describe: 'Country code (e.g., US, GB)',
          type: 'string',
          default: 'US'
        },
        types: {
          describe: 'Show types to include (e.g., Scripted,Reality)',
          type: 'string',
          coerce: (arg: string) => arg.split(',')
        },
        networks: {
          describe: 'Networks to include (e.g., HBO,Netflix)',
          type: 'string',
          coerce: (arg: string) => arg.split(',')
        },
        genres: {
          describe: 'Genres to include (e.g., Drama,Comedy)',
          type: 'string',
          coerce: (arg: string) => arg.split(',')
        },
        languages: {
          describe: 'Languages to include (e.g., English,Spanish)',
          type: 'string',
          coerce: (arg: string) => arg.split(',')
        },
        query: {
          alias: 'q',
          describe: 'Search query for shows',
          type: 'string',
          default: ''
        },
        slack: {
          alias: 's',
          describe: 'Output to Slack',
          type: 'boolean',
          default: false
        },
        showId: {
          describe: 'Show ID to get episodes for',
          type: 'number',
          default: 0
        },
        limit: {
          alias: 'l',
          describe: 'Maximum number of shows to display',
          type: 'number',
          default: 0
        },
        debug: {
          alias: 'D',
          describe: 'Enable debug mode',
          type: 'boolean',
          default: false
        },
        fetch: {
          alias: 'f',
          describe: 'Fetch type (network, web, all)',
          type: 'string',
          choices: ['network', 'web', 'all'],
          default: 'all'
        },
        help: {
          alias: 'h',
          describe: 'Show help',
          type: 'boolean',
          default: false
        },
        version: {
          alias: 'v',
          describe: 'Show version',
          type: 'boolean',
          default: false
        }
      })
      .help()
      .alias('help', 'h')
      .version()
      .alias('version', 'v')
      .parseSync() as ConsoleCliArgs;
  }

  /**
   * Display application header
   */
  public displayHeader(): void {
    this.output.log(`\n${this.configService.getAppName()} v${this.configService.getVersion()}`);
    this.output.log('='.repeat(30));
  }

  /**
   * Display application footer
   */
  public displayFooter(): void {
    this.output.log('\n' + '='.repeat(30));
    this.output.log(`Data provided by TVMaze API (${this.configService.getApiUrl()})`);
  }
}
