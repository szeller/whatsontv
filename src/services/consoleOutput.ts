import yargs from 'yargs';

import type { Show } from '../types/tvmaze.js';
import { consoleOutput } from '../utils/consoleOutput.js';
import { formatShowDetails } from '../utils/formatting.js';
import { groupShowsByNetwork, sortShowsByTime, getTodayDate } from '../utils/showUtils.js';


/**
 * Command line arguments for the TV show application
 */
export interface CliArgs {
  date?: string;
  search?: string;
  show?: number;
  time?: boolean;
}

/**
 * Configure and parse command line arguments
 * @returns Parsed command line arguments
 */
export function parseArgs(): CliArgs {
  return yargs(process.argv.slice(2))
    .options({
      date: {
        alias: 'd',
        describe: 'Date to show TV schedule for (YYYY-MM-DD)',
        type: 'string',
        default: getTodayDate()
      },
      search: {
        alias: 's',
        describe: 'Search for TV shows by name',
        type: 'string'
      },
      show: {
        describe: 'Show episodes for a specific show ID',
        type: 'number'
      },
      time: {
        alias: 't',
        describe: 'Sort shows by time',
        type: 'boolean',
        default: false
      }
    })
    .help()
    .alias('help', 'h')
    .parseSync();
}

/**
 * Display TV shows in the console
 * @param shows - Array of TV shows to display
 * @param timeSort - Whether to sort shows by time
 */
export function displayShows(shows: Show[], timeSort: boolean = false): void {
  if (shows.length === 0) {
    consoleOutput.log('No shows found for the specified criteria.');
    return;
  }

  const networkGroups = groupShowsByNetwork(shows);
  
  for (const networkName in networkGroups) {
    if (Object.prototype.hasOwnProperty.call(networkGroups, networkName)) {
      const networkShows = networkGroups[networkName];
      
      // Sort shows by time if requested
      const sortedShows = timeSort ? sortShowsByTime(networkShows) : networkShows;
      
      // Display network name
      consoleOutput.log(`\n${networkName}:`);
      
      // Display shows
      for (const show of sortedShows) {
        const formattedShow = formatShowDetails(show);
        consoleOutput.log(formattedShow);
      }
    }
  }
}
