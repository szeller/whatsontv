/**
 * Dependency Injection Container Setup
 * 
 * This file configures the tsyringe dependency injection container
 * with all service registrations for the application.
 */

import 'reflect-metadata';
import { container } from 'tsyringe';

// Local imports
import { ConsoleFormatter } from './formatters/consoleFormatter.js';
import type { OutputService } from './interfaces/outputService.js';
import type { ShowFormatter } from './interfaces/showFormatter.js';
import type { TvShowService } from './interfaces/tvShowService.js';
import { ConsoleOutputService } from './services/consoleOutputService.js';
import { TvMazeService } from './services/tvMazeService.js';
import { consoleOutput } from './utils/consoleOutput.js';
import { GotHttpClient } from './utils/gotHttpClient.js';
import type { HttpClient } from './utils/httpClient.js';
import { ChalkStyleService } from './utils/styleService.js';
import type { StyleService } from './utils/styleService.js';

// Register dependencies in the container
container.registerSingleton<StyleService>('StyleService', ChalkStyleService);
container.registerSingleton<ShowFormatter>('ShowFormatter', ConsoleFormatter);
container.registerSingleton<TvShowService>('TvShowService', TvMazeService);
container.registerSingleton<OutputService>('OutputService', ConsoleOutputService);
container.register('ConsoleOutput', { useValue: consoleOutput });
container.registerSingleton<HttpClient>('HttpClient', GotHttpClient);

export { container };
