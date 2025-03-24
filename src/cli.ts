#!/usr/bin/env node

import 'reflect-metadata';
import config from './config.js';
import { container } from './container.js';
import type { ConsoleOutput } from './interfaces/consoleOutput.js';
import type { OutputService } from './interfaces/outputService.js';
import type { TvShowService } from './interfaces/tvShowService.js';
import type { CliArgs } from './types/cliArgs.js';

// Get ConsoleOutput service for global error handling
const consoleOutput = container.resolve<ConsoleOutput>('ConsoleOutput');

// Add global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  consoleOutput.error('Uncaught Exception:');
  if (error !== null && typeof error === 'object') {
    consoleOutput.error(`${error.name}: ${error.message}`);
    if (error.stack !== undefined && error.stack !== null && error.stack.length > 0) {
      consoleOutput.error(error.stack);
    }
  } else {
    consoleOutput.error(String(error));
  }
  process.exit(1);
});

// Debug logging using ConsoleOutput.warn instead of console.warn
consoleOutput.warn('CLI module loaded, import.meta.url:', import.meta.url);
consoleOutput.warn('process.argv[1]:', process.argv[1]);

/**
 * Main function to run the CLI application
 * @param args CLI arguments for filtering shows
 */
export async function main(args?: CliArgs): Promise<void> {
  // Resolve the services from the container
  const outputService = container.resolve<OutputService>('OutputService');
  const tvShowService = container.resolve<TvShowService>('TvShowService');
  
  try {
    // Parse command line arguments
    const parsedArgs = args !== undefined ? args : outputService.parseArgs();
    
    // Display header
    outputService.displayHeader();
    
    // Use config values as defaults when CLI arguments aren't provided
    const types = parsedArgs.types?.length > 0 ? parsedArgs.types : config.types;
    const networks = parsedArgs.networks?.length > 0 ? parsedArgs.networks : config.networks;
    const genres = parsedArgs.genres?.length > 0 ? parsedArgs.genres : config.genres;
    const languages = parsedArgs.languages?.length > 0 ? parsedArgs.languages : config.languages;
    
    // Fetch shows based on the provided options
    const shows = await tvShowService.fetchShowsWithOptions({
      date: parsedArgs.date,
      country: parsedArgs.country,
      types: types,
      networks: networks,
      genres: genres,
      languages: languages
    });

    // Debug: Print all unique networks and web channels
    if (parsedArgs.debug === true) {
      const uniqueNetworks = new Set<string>();
      const uniqueStreamingServices = new Set<string>();
      
      for (const show of shows) {
        // Check for valid channel name
        if (show.channel && show.channel !== '') {
          if (show.isStreaming) {
            uniqueStreamingServices.add(show.channel);
          } else {
            uniqueNetworks.add(show.channel);
          }
        }
      }
      
      consoleOutput.log('\nAvailable Traditional Networks:');
      consoleOutput.log([...uniqueNetworks].sort().join(', '));
      
      consoleOutput.log('\nAvailable Streaming Services:');
      consoleOutput.log([...uniqueStreamingServices].sort().join(', '));
      
      // Print total counts
      consoleOutput.log(`\nTotal Shows: ${shows.length}`);
      consoleOutput.log(`Traditional Network Shows: ${shows.filter(s => !s.isStreaming).length}`);
      consoleOutput.log(`Streaming Service Shows: ${shows.filter(s => s.isStreaming).length}`);
    }

    // Display the shows
    await outputService.displayShows(shows, parsedArgs.timeSort);
    
    // Display footer
    outputService.displayFooter();
  } catch (error) {
    // Special handling for null prototype objects
    if (error !== null && 
        typeof error === 'object' && 
        Object.getPrototypeOf(error) === null) {
      consoleOutput.error(
        'Network error: Unable to connect to TVMaze API. ' +
        'Please check your internet connection.'
      );
    } else if (error instanceof Error) {
      consoleOutput.error('Error:', error.message);
    } else {
      // Improved error handling for non-Error objects
      try {
        const errorMessage = typeof error === 'object' 
          ? JSON.stringify(error, Object.getOwnPropertyNames(error)) 
          : String(error);
        consoleOutput.error('An unknown error occurred:', errorMessage);
      } catch (_stringifyError) {
        consoleOutput.error('An error occurred that could not be properly displayed');
      }
    }
  }
}

// Run the main function only once
if (import.meta.url.startsWith('file:')) {
  const modulePath = new URL(import.meta.url).pathname;
  // Only run if this is the main module
  if (process.argv[1] === modulePath) {
    void main();
  }
}
