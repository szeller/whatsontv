#!/usr/bin/env tsx

/**
 * Slack integration for WhatsOnTV
 * Sends TV show information to Slack
 */

import 'reflect-metadata';
import { container, initializeSlackContainer } from '../slackContainer.js';
import type { ProcessOutput } from '../interfaces/processOutput.js';
import type { TvShowService } from '../interfaces/tvShowService.js';
import type { ConfigService } from '../interfaces/configService.js';
import type { OutputService } from '../interfaces/outputService.js';
import { BaseCliApplication, runMain } from './cliBase.js';
import { registerGlobalErrorHandler } from '../utils/errorHandling.js';

// Initialize the Slack container
initializeSlackContainer();

// Get ProcessOutput service for global error handling
const processOutput = container.resolve<ProcessOutput>('ProcessOutput');

// Register global error handler
registerGlobalErrorHandler(processOutput);

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
    const processOutputFromContainer = containerInstance.resolve<ProcessOutput>('ProcessOutput');

    // Create the Slack CLI application
    return new BaseCliApplication(
      tvShowService,
      configService,
      processOutputFromContainer,
      outputService
    );
  } catch (error) {
    const processOutputForError = containerInstance.resolve<ProcessOutput>('ProcessOutput');
    processOutputForError.error(`Error resolving services: ${String(error)}`);
    
    // Check if the error is related to missing service registrations
    if (String(error).includes('SlackFormatter')) {
      processOutputForError.error(
        'The SlackFormatter service is not registered in the container.'
      );
      processOutputForError.error(
        'Please make sure to register it before running this application.'
      );
    } else if (String(error).includes('SlackOutputService')) {
      processOutputForError.error(
        'The SlackOutputService service is not registered in the container.'
      );
      processOutputForError.error(
        'Please make sure to register it before running this application.'
      );
    }
    
    throw error;
  }
}

// Create the Slack app and run it if this file is executed directly
runMain(() => createSlackApp(), processOutput);
