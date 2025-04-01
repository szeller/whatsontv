import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';
import yargs from 'yargs';
import type { Arguments } from 'yargs';

import type { ConfigService } from '../../interfaces/configService.js';
import type { ShowFormatter } from '../../interfaces/showFormatter.js';
import type { Show } from '../../schemas/domain.js';
import type { OutputService } from '../../interfaces/outputService.js';
import type { ConsoleOutput } from '../../interfaces/consoleOutput.js';
import type { NetworkGroups } from '../../utils/showUtils.js';
import { groupShowsByNetwork, sortShowsByTime } from '../../utils/showUtils.js';
import { getTodayDate } from '../../utils/dateUtils.js';
import { padString } from '../../utils/stringUtils.js';

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
  debug: boolean;
  fetch: 'network' | 'web' | 'all';
  help: boolean;
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

    // Always sort shows by time first using the shared utility
    const sortedShows = sortShowsByTime(shows);
    
    // Group shows by network if requested
    const networkGroups = groupByNetwork 
      ? this.groupShowsByNetwork(sortedShows) 
      : { 'All Shows': sortedShows };
    
    try {
      // Format the shows - pass the groupByNetwork value as timeSort
      // This maintains compatibility with existing tests
      const formattedOutput = this.formatter.formatNetworkGroups(networkGroups, groupByNetwork);
      
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
   *                (optional, for backward compatibility)
   * @returns Promise that resolves when shows are displayed
   */
  public async displayNetworkGroups(
    networkGroups: NetworkGroups,
    timeSort: boolean = false
  ): Promise<void> {
    try {
      // Format shows grouped by network
      const formattedOutput = this.formatter.formatNetworkGroups(
        networkGroups,
        timeSort
      );
      
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
   * Parse command line arguments for the CLI
   * @param args Command line arguments
   * @returns Parsed arguments object
   */
  public parseArguments(args: string[]): ConsoleCliArgs {
    const parsedArgs = yargs(args)
      .options({
        date: {
          alias: 'd',
          describe: 'Date to show schedule for (YYYY-MM-DD)',
          default: getTodayDate(),
          type: 'string'
        },
        country: {
          alias: 'c',
          describe: 'Country code (e.g., US)',
          default: 'US',
          type: 'string'
        },
        types: {
          alias: 't',
          describe: 'Show types to include',
          type: 'array',
          default: []
        },
        networks: {
          alias: 'n',
          describe: 'Networks to include',
          type: 'array',
          default: []
        },
        genres: {
          alias: 'g',
          describe: 'Genres to include',
          type: 'array',
          default: []
        },
        languages: {
          alias: 'l',
          describe: 'Languages to include',
          type: 'array',
          default: []
        },
        debug: {
          describe: 'Show debug information',
          type: 'boolean',
          default: false
        },
        fetch: {
          describe: 'Fetch data source (network, web, all)',
          choices: ['network', 'web', 'all'],
          default: 'all'
        }
      })
      .help()
      .argv as ConsoleCliArgs;
    
    return parsedArgs;
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
          alias: 'g',
          describe: 'Filter by genres (comma-separated)',
          type: 'string',
          default: '',
          coerce: (arg: string) => arg.split(',')
        },
        languages: {
          alias: 'L',
          describe: 'Filter by languages (comma-separated)',
          type: 'string',
          default: '',
          coerce: (arg: string) => arg.split(',')
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
        }
      })
      .help()
      .alias('help', 'h')
      .parseSync() as ConsoleCliArgs;
  }

  /**
   * Display application header
   */
  public displayHeader(): void {
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
   */
  public displayFooter(): void {
    const separator = this.createSeparator();
    
    // Display footer
    this.output.log('');
    this.output.log(separator);
    this.output.log('Data provided by TVMaze API (https://api.tvmaze.com)');
  }

  /**
   * Create a separator line with consistent length
   * @returns Formatted separator string
   * @private
   */
  private createSeparator(length: number = 30, char: string = '='): string {
    return padString('', length, char);
  }

  /**
   * Display help information to the user
   * @param helpText The help text to display
   */
  public displayHelp(helpText: string): void {
    this.displayHeader();
    this.output.log(helpText);
    this.displayFooter();
  }
}
