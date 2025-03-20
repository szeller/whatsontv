import yargs from 'yargs';
import type { Arguments } from 'yargs';

import config from '../config.js';
import { ConsoleFormatter } from '../formatters/consoleFormatter.js';
import type { OutputService } from '../interfaces/outputService.js';
import type { ShowFormatter } from '../interfaces/showFormatter.js';
import type { Show } from '../types/tvmaze.js';
import { consoleOutput } from '../utils/console.js';

import { groupShowsByNetwork, sortShowsByTime, getTodayDate } from './tvShowService.js';

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
}

/**
 * Console output service for displaying TV show information
 * Implements the OutputService interface
 */
export class ConsoleOutputService implements OutputService {
  private formatter: ShowFormatter;

  /**
   * Create a new ConsoleOutputService
   * @param formatter Optional custom formatter (defaults to ConsoleFormatter)
   */
  constructor(formatter?: ShowFormatter) {
    this.formatter = formatter || new ConsoleFormatter();
  }

  /**
   * Display TV shows based on the timeSort option
   * @param shows Array of TV shows to display
   * @param timeSort Whether to sort shows by time (true) or group by network (false)
   * @returns Promise that resolves when shows are displayed
   */
  public async displayShows(shows: Show[], timeSort: boolean = false): Promise<void> {
    if (shows.length === 0) {
      consoleOutput.log('No shows found for the specified criteria.');
      return;
    }

    if (timeSort) {
      // Sort shows by time
      const sortedShows = sortShowsByTime(shows);
      
      // Group shows with the same name and no airtime
      const groupedShows = this.groupShowsByNameAndAirtime(sortedShows);
      
      // Display shows sorted by time
      for (const showGroup of groupedShows) {
        if (showGroup.length === 1 || showGroup[0].airtime) {
          // Single show or shows with airtime
          consoleOutput.log(this.formatter.formatShow(showGroup[0]));
        } else {
          // Multiple episodes of the same show with no airtime
          consoleOutput.log(this.formatter.formatMultipleEpisodes(showGroup));
        }
      }
    } else {
      // Group shows by network
      const networkGroups = groupShowsByNetwork(shows);
      
      // Format and display shows grouped by network
      const formattedOutput = this.formatter.formatNetworkGroups(networkGroups, timeSort);
      for (const line of formattedOutput) {
        consoleOutput.log(line);
      }
    }
  }

  /**
   * Check if the output service is properly initialized
   * @returns Always true for console output
   */
  public isInitialized(): boolean {
    return true;
  }

  /**
   * Parse command line arguments with type safety.
   * @param args Command line arguments to parse
   * @returns Parsed CLI arguments with proper types
   */
  public parseArgs(args: string[] = process.argv.slice(2)): CliArgs {
    return yargs(args)
      .usage('Usage: $0 [options]')
      .option('date', {
        alias: 'd',
        describe: 'Date to get shows for (YYYY-MM-DD)',
        type: 'string',
        default: getTodayDate()
      })
      .option('country', {
        alias: 'c',
        describe: 'Country code to get shows for',
        type: 'string',
        default: 'US'
      })
      .option('types', {
        alias: 't',
        describe: 'Show types to include',
        type: 'array',
        default: config.types
      })
      .option('networks', {
        alias: 'n',
        describe: 'Networks to include',
        type: 'array',
        default: config.networks
      })
      .option('genres', {
        alias: 'g',
        describe: 'Genres to include',
        type: 'array',
        default: config.genres
      })
      .option('languages', {
        alias: 'l',
        describe: 'Languages to include',
        type: 'array',
        default: []
      })
      .option('time-sort', {
        alias: 's',
        describe: 'Sort by airtime instead of grouping by network',
        type: 'boolean',
        default: false
      })
      .help()
      .alias('help', 'h')
      .parseSync() as CliArgs;
  }

  /**
   * Group shows by name and airtime status
   * This helps identify multiple episodes of the same show with no airtime
   * @param shows Shows to group
   * @returns Array of show groups
   */
  private groupShowsByNameAndAirtime(shows: Show[]): Show[][] {
    const result: Show[][] = [];
    let currentGroup: Show[] = [];
    
    for (const show of shows) {
      if (currentGroup.length === 0) {
        // Start a new group
        currentGroup.push(show);
      } else if (
        currentGroup[0].show.name === show.show.name && 
        !currentGroup[0].airtime && 
        !show.airtime
      ) {
        // Add to current group if same show name and both have no airtime
        currentGroup.push(show);
      } else {
        // Start a new group
        result.push(currentGroup);
        currentGroup = [show];
      }
    }
    
    // Add the last group if not empty
    if (currentGroup.length > 0) {
      result.push(currentGroup);
    }
    
    return result;
  }
}
