import yargs from 'yargs';
import type { Arguments } from 'yargs';

import config from '../config.js';
import type { Show } from '../types/tvmaze.js';
import { consoleOutput } from '../utils/console.js';
import { formatShowDetails } from '../utils/formatting.js';

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
 * Parse command line arguments with type safety.
 * @param args Command line arguments to parse
 * @returns Parsed CLI arguments with proper types
 */
export function parseArgs(args: string[] = process.argv.slice(2)): CliArgs {
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
      default: []
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
 * Display TV shows based on the timeSort option
 * @param shows - Array of TV shows to display
 * @param timeSort - Whether to sort shows by time (true) or group by network (false)
 */
export function displayShows(shows: Show[], timeSort: boolean): void {
  if (shows.length === 0) {
    consoleOutput.log('No shows found for the specified criteria.');
    return;
  }

  if (timeSort) {
    // Sort shows by time
    const sortedShows = sortShowsByTime(shows);
    
    // Display shows sorted by time
    sortedShows.forEach(show => {
      consoleOutput.log(formatShowDetails(show));
    });
  } else {
    // Group shows by network
    const networkGroups = groupShowsByNetwork(shows);
    
    // Display shows grouped by network
    Object.entries(networkGroups).forEach(([network, shows]) => {
      consoleOutput.log(`\n${network}:`);
      shows.forEach(show => {
        consoleOutput.log(formatShowDetails(show));
      });
    });
  }
}
