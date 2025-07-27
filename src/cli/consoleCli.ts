#!/usr/bin/env tsx

import 'reflect-metadata';
import { container } from '../container.js';
import type { ConsoleOutput } from '../interfaces/consoleOutput.js';
import type { OutputService } from '../interfaces/outputService.js';
import type { TvShowService } from '../interfaces/tvShowService.js';
import type { ConfigService } from '../interfaces/configService.js';
import { BaseCliApplication, runMain } from './cliBase.js';
import { registerGlobalErrorHandler } from '../utils/errorHandling.js';

// Get ConsoleOutput service for global error handling
const consoleOutput = container.resolve<ConsoleOutput>('ConsoleOutput');

// Register global error handler
registerGlobalErrorHandler(consoleOutput);

/**
 * Main function that resolves services from the container and runs the CLI
 */
export function createCliApp(): BaseCliApplication {
  return createCliAppWithContainer(container);
}

/**
 * Create CLI app with a specific container (useful for testing)
 */
export function createCliAppWithContainer(containerInstance: typeof container): BaseCliApplication {
  // Resolve all required services from the specified container
  const tvShowService = containerInstance.resolve<TvShowService>('TvShowService');
  const configService = containerInstance.resolve<ConfigService>('ConfigService');
  const outputService = containerInstance.resolve<OutputService>('OutputService');
  const consoleOutputFromContainer = containerInstance.resolve<ConsoleOutput>('ConsoleOutput');
  
  // Create the CLI application
  return new BaseCliApplication(
    tvShowService,
    configService,
    consoleOutputFromContainer,
    outputService
  );
}

// Create the CLI app and run it if this file is executed directly
runMain(() => createCliApp(), consoleOutput);
