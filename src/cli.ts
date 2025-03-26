#!/usr/bin/env node

import 'reflect-metadata';
import { container } from './container.js';
import type { ConsoleOutput } from './interfaces/consoleOutput.js';
import type { OutputService } from './interfaces/outputService.js';
import type { TvShowService } from './interfaces/tvShowService.js';
import type { ConfigService } from './interfaces/configService.js';

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

/**
 * Main function to run the CLI application
 */
export async function main(): Promise<void> {
  // Resolve the services from the container
  const outputService = container.resolve<OutputService>('OutputService');
  const tvShowService = container.resolve<TvShowService>('TvShowService');
  const configService = container.resolve<ConfigService>('ConfigService');
  
  try {
    // Get configuration options
    const showOptions = configService.getShowOptions();
    const cliOptions = configService.getCliOptions();
    
    // Display header
    outputService.displayHeader();
    
    // Fetch shows based on the show options
    const shows = await tvShowService.fetchShows(showOptions);

    // Debug: Print all unique networks and web channels
    if (cliOptions.debug === true) {
      const uniqueNetworks = new Set<string>();
      
      for (const show of shows) {
        // Check for valid network name
        if (show.network !== null && show.network !== undefined && show.network !== '') {
          uniqueNetworks.add(show.network);
        }
      }
      
      consoleOutput.log('\nAvailable Networks:');
      consoleOutput.log([...uniqueNetworks].sort().join(', '));
      
      consoleOutput.log(`\nTotal Shows: ${shows.length}`);
    }

    // Display the shows
    await outputService.displayShows(shows, cliOptions.timeSort);
    
    // Display footer
    outputService.displayFooter();
  } catch (error) {
    // Handle any errors that occur during execution
    if (error instanceof Error) {
      consoleOutput.error(`Error: ${error.message}`);
      // Only log stack trace if it exists and is not empty
      if (error.stack !== undefined && error.stack !== null && error.stack.length > 0) {
        consoleOutput.error(error.stack);
      }
    } else {
      consoleOutput.error(`Error: ${String(error)}`);
    }
    process.exit(1);
  }
}

// Run the main function if this file is executed directly
if (import.meta.url.startsWith('file:') && 
    process.argv[1] === import.meta.url.slice(7)) {
  main().catch((error) => {
    consoleOutput.error(`Unhandled error in main: ${String(error)}`);
    process.exit(1);
  });
}
