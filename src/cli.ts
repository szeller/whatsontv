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
 * Interface for services that can be injected into the runCli function
 */
export interface CliServices {
  outputService: OutputService;
  tvShowService: TvShowService;
  configService: ConfigService;
  consoleOutput: ConsoleOutput;
}

/**
 * Core CLI application logic, separated from container resolution for testability
 * @param services Services required by the CLI application
 */
export async function runCli(services: CliServices): Promise<void> {
  const { outputService, tvShowService, configService, consoleOutput: output } = services;
  
  try {
    // Get configuration options
    const showOptions = configService.getShowOptions();
    const cliOptions = configService.getCliOptions();
    
    // Skip further processing if help was requested
    // (yargs will have already displayed the help text)
    if (cliOptions.help) {
      return;
    }
    
    // Check if OutputService is initialized
    if (!outputService.isInitialized()) {
      output.error('Error: Output service not properly initialized');
      return;
    }
    
    // Display header
    outputService.displayHeader();
    
    try {
      // Fetch TV shows
      const shows = await tvShowService.fetchShows(showOptions);
      
      // Display debug info if enabled
      if (cliOptions.debug) {
        const networks = [...new Set(shows.map(show => show.network))].sort();
        output.log('\nAvailable Networks:');
        output.log(networks.join(', '));
        output.log(`\nTotal Shows: ${shows.length}`);
      }
      
      // Display shows
      await outputService.displayShows(shows, cliOptions.groupByNetwork);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      output.error(`Error fetching TV shows: ${errorMessage}`);
    }
    
    // Display footer
    outputService.displayFooter();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    output.error(`Unexpected error: ${errorMessage}`);
  }
}

/**
 * Main function that resolves services from the container and runs the CLI
 */
export async function main(): Promise<void> {
  // Resolve all required services from the container
  const services: CliServices = {
    outputService: container.resolve<OutputService>('OutputService'),
    tvShowService: container.resolve<TvShowService>('TvShowService'),
    configService: container.resolve<ConfigService>('ConfigService'),
    consoleOutput
  };
  
  // Run the CLI with the resolved services
  return runCli(services);
}

// Run the main function if this file is executed directly
if (import.meta.url.startsWith('file:') && 
    process.argv[1] === import.meta.url.slice(7)) {
  main().catch((error) => {
    consoleOutput.error(`Unhandled error in main: ${String(error)}`);
    process.exit(1);
  });
}
