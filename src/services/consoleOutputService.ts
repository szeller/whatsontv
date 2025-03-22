import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';
import yargs from 'yargs';
import type { Arguments } from 'yargs';

import config from '../config.js';
import type { ConsoleOutput } from '../interfaces/consoleOutput.js';
import type { OutputService } from '../interfaces/outputService.js';
import type { ShowFormatter } from '../interfaces/showFormatter.js';
import type { NetworkGroups } from '../types/app.js';
import type { Show } from '../types/tvmaze.js';
import { getTodayDate, groupShowsByNetwork } from '../utils/showUtils.js';

/**
 * CLI arguments interface
 */
export interface CliArgs extends Arguments {
  date: string;
  country: string;
  types: string[];
  networks: string[];
  genres: string[];
  languages: string[];
  timeSort: boolean;
  debug: boolean;
}

/**
 * Console output service for displaying TV show information
 * Implements the OutputService interface
 */
@injectable()
export class ConsoleOutputService implements OutputService {
  /**
   * Create a new ConsoleOutputService
   * @param formatter Formatter for TV show output
   * @param output Console output utility
   */
  constructor(
    @inject('ShowFormatter') protected readonly formatter: ShowFormatter,
    @inject('ConsoleOutput') protected readonly output: ConsoleOutput
  ) {}

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
    const networkGroups = groupShowsByNetwork(shows);
    const formattedOutput = this.formatter.formatNetworkGroups(networkGroups, timeSort);
    
    for (const line of formattedOutput) {
      this.output.log(line);
    }
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
    
    for (const line of formattedOutput) {
      this.output.log(line);
    }
  }

  /**
   * Check if the service is properly initialized
   * @returns True if the service is ready to use
   */
  public isInitialized(): boolean {
    return this.output !== null && this.output !== undefined && 
           this.formatter !== null && this.formatter !== undefined;
  }

  /**
   * Parse command line arguments
   * @returns Parsed command line arguments
   */
  public parseArgs(): CliArgs {
    return yargs(process.argv.slice(2))
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
        debug: {
          alias: 'D',
          describe: 'Enable debug mode',
          type: 'boolean',
          default: false
        }
      })
      .help()
      .alias('help', 'h')
      .parseSync() as CliArgs;
  }

  /**
   * Display application header
   */
  public displayHeader(): void {
    this.output.log(`\n${config.appName} v${config.version}`);
    this.output.log('='.repeat(30));
  }

  /**
   * Display application footer
   */
  public displayFooter(): void {
    this.output.log('\n' + '='.repeat(30));
    this.output.log(`Data provided by TVMaze API (${config.apiUrl})`);
  }
}
