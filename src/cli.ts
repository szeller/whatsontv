#!/usr/bin/env node

import { URL } from 'url';

import chalk from 'chalk';
import yargs from 'yargs';
import type { Arguments } from 'yargs';
import { hideBin } from 'yargs/helpers';

import config from './config.js';
import {
  fetchTvShows,
  groupShowsByNetwork,
  sortShowsByTime,
  getTodayDate
} from './services/tvShowService.js';
import type { Show } from './types/tvmaze.js';
import { consoleOutput } from './utils/console.js';
import { formatShowDetails } from './utils/formatting.js';


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
export const parseArgs = (args: string[]): CliArgs => {
  return yargs(args)
    .option('date', {
      alias: 'd',
      description: 'Date to fetch shows for (YYYY-MM-DD)',
      type: 'string',
      default: getTodayDate()
    })
    .option('country', {
      alias: 'c',
      description: 'Country code (e.g., US, GB)',
      type: 'string',
      default: config.country
    })
    .option('types', {
      alias: 't',
      description: 'Show types to filter by (e.g., News, Scripted, Reality, Documentary)',
      type: 'array',
      default: config.types
    })
    .option('networks', {
      alias: 'n',
      description: 'Networks to filter by (e.g., CBS, Netflix, Discovery, HBO)',
      type: 'array',
      default: config.networks
    })
    .option('genres', {
      alias: 'g',
      description: 'Genres to filter by (e.g., Drama, Comedy, Action)',
      type: 'array',
      default: config.genres
    })
    .option('languages', {
      alias: 'l',
      description: 'Languages to filter by (e.g., English, Spanish)',
      type: 'array',
      default: config.languages
    })
    .option('time-sort', {
      alias: 's',
      type: 'boolean',
      description: 'Sort shows by time instead of network',
      default: false
    })
    .help()
    .parse() as CliArgs;
};

// Parse arguments from process.argv
export const argv: CliArgs = parseArgs(hideBin(process.argv));

/**
 * Display TV shows based on CLI arguments.
 * Shows can be sorted by time or grouped by network.
 * @param args CLI arguments for filtering shows
 */
export async function displayShows(args: CliArgs = argv): Promise<void> {
  try {
    const shows: Show[] = await fetchTvShows({
      date: args.date,
      country: args.country,
      types: args.types,
      networks: args.networks,
      genres: args.genres,
      languages: args.languages
    });

    if (shows.length === 0) {
      consoleOutput.log('No shows found for the specified criteria.');
      return;
    }

    // Group or sort shows based on CLI args
    if (args.timeSort) {
      const displayShows: Show[] = sortShowsByTime(shows);
      displayShows.forEach((show: Show): void => {
        consoleOutput.log(formatShowDetails(show));
      });
    } else {
      const showsByNetwork = groupShowsByNetwork(shows);
      Object.entries(showsByNetwork).forEach(([network, networkShows]): void => {
        consoleOutput.log(chalk.bold(network));
        networkShows.forEach((show: Show): void => {
          consoleOutput.log(formatShowDetails(show));
        });
        consoleOutput.log('');
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      consoleOutput.error('Error:', error.message);
    } else {
      consoleOutput.error('An unknown error occurred');
    }
  }
}

// Only run displayShows if this is the main module
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  void displayShows();
}
