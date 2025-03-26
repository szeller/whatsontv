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
  timeSort: boolean;
  query: string;
  slack: boolean;
  showId: number;
  limit: number;
  help: boolean;
  version: boolean;
  debug: boolean;
  webOnly: boolean;
  showAll: boolean;
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
   * Display TV shows based on the timeSort option
   * @param shows Array of TV shows to display
   * @param timeSort Whether to sort shows by time (true) or group by network (false)
   * @returns Promise that resolves when shows are displayed
   */
  public async displayShows(shows: Show[], timeSort: boolean = false): Promise<void> {
    if (shows.length === 0) {
      this.output.log('No shows found for the specified criteria.');
      return;
    }

    // Group shows by network and format them
    const networkGroups = this.groupShowsByNetwork(shows);
    const formattedOutput = this.formatter.formatNetworkGroups(networkGroups, timeSort);

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
        timeSort: {
          alias: 't',
          describe: 'Sort shows by time',
          type: 'boolean',
          default: false
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
        webOnly: {
          describe: 'Only show web series',
          type: 'boolean',
          default: false
        },
        showAll: {
          describe: 'Show all shows, including those without air dates',
          type: 'boolean',
          default: false
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
