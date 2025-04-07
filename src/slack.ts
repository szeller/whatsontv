#!/usr/bin/env node

/**
 * Slack integration for WhatsOnTV
 * Sends TV show information to Slack
 */

import 'reflect-metadata';
import { container } from './container.js';
import type { ConsoleOutput } from './interfaces/consoleOutput.js';
import type { TvShowService } from './interfaces/tvShowService.js';
import type { ConfigService } from './interfaces/configService.js';
import type { SlackShowFormatter } from './interfaces/showFormatter.js';
import type { NetworkGroups } from './schemas/domain.js';
import { formatDate } from './utils/dateUtils.js';
import { groupShowsByNetwork } from './utils/showUtils.js';

// Get ConsoleOutput service for global error handling
const consoleOutput = container.resolve<ConsoleOutput>('ConsoleOutput');

// Add global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  consoleOutput.error('Uncaught Exception:');
  if (error !== null && typeof error === 'object') {
    consoleOutput.error(`${error.name}: ${error.message}`);
    if (error.stack !== undefined && error.stack !== null && error.stack !== '') {
      consoleOutput.error(error.stack);
    }
  } else {
    consoleOutput.error(String(error));
  }
  process.exit(1);
});

/**
 * Interface for services that can be injected into the runSlackCli function
 */
export interface SlackCliServices {
  tvShowService: TvShowService;
  configService: ConfigService;
  slackFormatter: SlackShowFormatter;
  consoleOutput: ConsoleOutput;
}

/**
 * Core Slack CLI application logic, separated from container resolution for testability
 * @param services Services required by the Slack CLI application
 */
export async function runSlackCli(services: SlackCliServices): Promise<void> {
  const { tvShowService, configService, slackFormatter, consoleOutput: output } = services;
  
  try {
    // Get configuration options for fetching shows
    const showOptions = configService.getShowOptions();
    
    try {
      // Fetch TV shows
      const shows = await tvShowService.fetchShows(showOptions);
      
      // Group shows by network
      const networkGroups: NetworkGroups = groupShowsByNetwork(shows);

      // Format the shows
      const blocks = slackFormatter.formatNetworkGroups(networkGroups);
      
      // Create the full Slack message payload
      const slackPayload = {
        channel: 'console-output', // Placeholder channel
        text: `*📺 TV Shows for ${formatDate(new Date())}*`, // Fallback text
        blocks
      };
      
      // Output the formatted JSON to the console
      output.log('Slack message payload:');
      output.log(JSON.stringify(slackPayload, null, 2));
      
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
 * Main function that resolves services from the container and runs the Slack CLI
 */
export async function main(): Promise<void> {
  try {
    // Resolve all required services from the container
    const services: SlackCliServices = {
      tvShowService: container.resolve<TvShowService>('TvShowService'),
      configService: container.resolve<ConfigService>('ConfigService'),
      slackFormatter: container.resolve<SlackShowFormatter>('SlackFormatter'),
      consoleOutput
    };
    
    // Run the Slack CLI with the resolved services
    return runSlackCli(services);
  } catch (error) {
    consoleOutput.error(`Error resolving services: ${String(error)}`);
    
    // Check if the error is related to missing SlackFormatter registration
    if (String(error).includes('SlackFormatter')) {
      consoleOutput.error('The SlackFormatter service is not registered in the container.');
      consoleOutput.error('Please make sure to register it before running this application.');
    }
    
    throw error;
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
