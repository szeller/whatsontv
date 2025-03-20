#!/usr/bin/env node

import { parseArgs, displayShows, type CliArgs } from './services/consoleOutput.js';
import { fetchTvShows } from './services/tvShowService.js';
import { consoleOutput } from './utils/console.js';

/**
 * Main function to run the CLI application
 * @param args CLI arguments for filtering shows
 */
export async function main(args: CliArgs = parseArgs()): Promise<void> {
  try {
    const shows = await fetchTvShows({
      date: args.date,
      country: args.country,
      types: args.types,
      networks: args.networks,
      genres: args.genres,
      languages: args.languages
    });

    displayShows(shows, args.timeSort);
  } catch (error) {
    if (error instanceof Error) {
      consoleOutput.error('Error:', error.message);
    } else {
      consoleOutput.error('An unknown error occurred');
    }
  }
}

// Run the main function
void main();
