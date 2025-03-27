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
    
    // Show help if requested
    if (cliOptions.help) {
      if (typeof configService.getHelpText === 'function') {
        const helpText = configService.getHelpText();
        if (typeof outputService.displayHelp === 'function') {
          outputService.displayHelp(helpText);
        } else {
          output.log(String(helpText)); // Ensure helpText is properly typed
        }
      } else {
        output.log('Help requested, but no help text available.');
      }
      return;
    }
    
    // Check if OutputService is initialized
    if (!outputService.isInitialized()) {
      const error = new Error('OutputService is not initialized');
      output.error(`Error: ${error.message}`);
      return; 
    }
    
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
      
      // Only output debug info if not running in test mode
      const isTestMode = process.env.NODE_ENV === 'test';
      if (!isTestMode) {
        output.log('\nAvailable Networks:');
        output.log([...uniqueNetworks].sort().join(', '));
        
        output.log(`\nTotal Shows: ${shows.length}`);
      }
    }

    // Display the shows - always sort by time, but allow toggling network grouping
    // For now, we'll always group by network (true)
    await outputService.displayShows(shows, true);
    
    // Display footer
    outputService.displayFooter();
  } catch (error) {
    // Handle any errors that occur during execution
    if (error instanceof Error) {
      output.error(`Error: ${error.message}`);
      // Only log stack trace if it exists and is not empty
      if (error.stack !== undefined && error.stack !== null && error.stack.length > 0) {
        output.error(error.stack);
      }
    } else {
      output.error(`Error: ${String(error)}`);
    }
    return; 
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
