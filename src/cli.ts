#!/usr/bin/env node

import { ConsoleOutputService, type CliArgs } from './services/consoleOutputService.js';
import { fetchTvShows } from './services/tvShowService.js';
import { consoleOutput } from './utils/console.js';

/**
 * Main function to run the CLI application
 * @param args CLI arguments for filtering shows
 */
export async function main(args?: CliArgs): Promise<void> {
  const outputService = new ConsoleOutputService();
  const parsedArgs = args || outputService.parseArgs();
  
  try {
    const shows = await fetchTvShows({
      date: parsedArgs.date,
      country: parsedArgs.country,
      types: parsedArgs.types,
      networks: parsedArgs.networks,
      genres: parsedArgs.genres,
      languages: parsedArgs.languages
    });

    await outputService.displayShows(shows, parsedArgs.timeSort);
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
