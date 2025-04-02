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
    // Get configuration options for fetching shows
    const showOptions = configService.getShowOptions();
    
    try {
      // Fetch TV shows
      const shows = await tvShowService.fetchShows(showOptions);
      
      // Let the OutputService handle all rendering aspects
      await outputService.renderOutput(shows);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      output.error(`Error fetching TV shows: ${errorMessage}`);
    }
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
