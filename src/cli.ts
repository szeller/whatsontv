#!/usr/bin/env node

import 'reflect-metadata';
import { container } from './container.js';
import type { ConsoleOutput } from './interfaces/consoleOutput.js';
import type { OutputService } from './interfaces/outputService.js';
import type { TvShowService } from './interfaces/tvShowService.js';
import type { ConfigService } from './interfaces/configService.js';
import { BaseCliApplication, runMain } from './utils/cliBase.js';
import { registerGlobalErrorHandler } from './utils/errorHandling.js';

// Get ConsoleOutput service for global error handling
const consoleOutput = container.resolve<ConsoleOutput>('ConsoleOutput');

// Register global error handler
registerGlobalErrorHandler(consoleOutput);

/**
 * Main function that resolves services from the container and runs the CLI
 */
export function createCliApp(): BaseCliApplication {
  // Resolve all required services from the container
  const tvShowService = container.resolve<TvShowService>('TvShowService');
  const configService = container.resolve<ConfigService>('ConfigService');
  const outputService = container.resolve<OutputService>('OutputService');
  
  // Create the CLI application
  return new BaseCliApplication(
    tvShowService,
    configService,
    consoleOutput,
    outputService
  );
}

// Create the CLI app and run it if this file is executed directly
runMain(createCliApp(), consoleOutput);
