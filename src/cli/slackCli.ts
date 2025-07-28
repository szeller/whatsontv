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
  return createSlackAppWithContainer(container);
}

/**
 * Create Slack app with a specific container (useful for testing)
 * @param containerInstance The container to resolve services from
 * @returns A new SlackCliApplication instance
 */
export function createSlackAppWithContainer(
  containerInstance: typeof container
): BaseCliApplication {
  try {
    // Resolve all required services from the specified container
    const tvShowService = containerInstance.resolve<TvShowService>('TvShowService');
    const configService = containerInstance.resolve<ConfigService>('ConfigService');
    const outputService = containerInstance.resolve<OutputService>('SlackOutputService');
    const consoleOutputFromContainer = containerInstance.resolve<ConsoleOutput>('ConsoleOutput');
    
    // Create the Slack CLI application
    return new BaseCliApplication(
      tvShowService,
      configService,
      consoleOutputFromContainer,
      outputService
    );
  } catch (error) {
    const consoleOutputForError = containerInstance.resolve<ConsoleOutput>('ConsoleOutput');
    consoleOutputForError.error(`Error resolving services: ${String(error)}`);
    
    // Check if the error is related to missing service registrations
    if (String(error).includes('SlackFormatter')) {
      consoleOutputForError.error(
        'The SlackFormatter service is not registered in the container.'
      );
      consoleOutputForError.error(
        'Please make sure to register it before running this application.'
      );
    } else if (String(error).includes('SlackOutputService')) {
      consoleOutputForError.error(
        'The SlackOutputService service is not registered in the container.'
      );
      consoleOutputForError.error(
        'Please make sure to register it before running this application.'
      );
    }
    
    throw error;
  }
}

// Create the Slack app and run it if this file is executed directly
runMain(() => createSlackApp(), consoleOutput);
