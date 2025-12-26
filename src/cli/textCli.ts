#!/usr/bin/env tsx

import 'reflect-metadata';
import { container } from '../textCliContainer.js';
import type { ProcessOutput } from '../interfaces/processOutput.js';
import type { OutputService } from '../interfaces/outputService.js';
import type { TvShowService } from '../interfaces/tvShowService.js';
import type { ConfigService } from '../interfaces/configService.js';
import { BaseCliApplication, runMain } from './cliBase.js';
import { registerGlobalErrorHandler } from '../utils/errorHandling.js';

// Get ProcessOutput service for global error handling
const processOutput = container.resolve<ProcessOutput>('ProcessOutput');

// Register global error handler
registerGlobalErrorHandler(processOutput);

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
  const processOutputFromContainer = containerInstance.resolve<ProcessOutput>('ProcessOutput');

  // Create the CLI application
  return new BaseCliApplication(
    tvShowService,
    configService,
    processOutputFromContainer,
    outputService
  );
}

// Create the CLI app and run it if this file is executed directly
runMain(() => createCliApp(), processOutput);
