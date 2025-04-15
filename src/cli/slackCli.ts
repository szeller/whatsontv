#!/usr/bin/env tsx

/**
 * Slack integration for WhatsOnTV
 * Sends TV show information to Slack
 */

import 'reflect-metadata';
import { container, initializeSlackContainer } from '../slackContainer.js';
import type { ConsoleOutput } from '../interfaces/consoleOutput.js';
import type { TvShowService } from '../interfaces/tvShowService.js';
import type { ConfigService } from '../interfaces/configService.js';
import type { OutputService } from '../interfaces/outputService.js';
import { BaseCliApplication, runMain } from './cliBase.js';
import { registerGlobalErrorHandler } from '../utils/errorHandling.js';

// Initialize the Slack container
initializeSlackContainer();

// Get ConsoleOutput service for global error handling
const consoleOutput = container.resolve<ConsoleOutput>('ConsoleOutput');

// Register global error handler
registerGlobalErrorHandler(consoleOutput);

/**
 * Create a Slack CLI application instance with all required services
 * @returns A new SlackCliApplication instance
 */
export function createSlackApp(): BaseCliApplication {
  try {
    // Resolve all required services from the container
    const tvShowService = container.resolve<TvShowService>('TvShowService');
    const configService = container.resolve<ConfigService>('ConfigService');
    const outputService = container.resolve<OutputService>('SlackOutputService');
    
    // Create the Slack CLI application
    return new BaseCliApplication(
      tvShowService,
      configService,
      consoleOutput,
      outputService
    );
  } catch (error) {
    consoleOutput.error(`Error resolving services: ${String(error)}`);
    
    // Check if the error is related to missing service registrations
    if (String(error).includes('SlackFormatter')) {
      consoleOutput.error('The SlackFormatter service is not registered in the container.');
      consoleOutput.error('Please make sure to register it before running this application.');
    } else if (String(error).includes('SlackOutputService')) {
      consoleOutput.error('The SlackOutputService service is not registered in the container.');
      consoleOutput.error('Please make sure to register it before running this application.');
    }
    
    throw error;
  }
}

// Create the Slack app and run it if this file is executed directly
runMain(createSlackApp(), consoleOutput);
