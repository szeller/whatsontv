/**
 * Test container setup for dependency injection tests
 * Provides a configured container with mock services
 */

import 'reflect-metadata';
import { jest } from '@jest/globals';
import { container, DependencyContainer } from 'tsyringe';

import { ConsoleFormatter } from '../../formatters/consoleFormatter.js';
import { ConsoleOutputService } from '../../services/consoleOutputService.js';
import { TvShowServiceImpl } from '../../services/tvShowService.js';
import { PlainStyleService } from '../../utils/styleService.js';

import type { HttpClient, HttpResponse } from '../../utils/httpClient.js';
import type { OutputService } from '../../interfaces/outputService.js';
import type { ShowFormatter } from '../../interfaces/showFormatter.js';
import type { StyleService } from '../../utils/styleService.js';
import type { TvShowService } from '../../interfaces/tvShowService.js';

/**
 * Create a mock HTTP client for testing
 * @returns Mock HTTP client
 */
export function createMockHttpClient(): HttpClient {
  // Create a simple mock object that matches the HttpClient interface
  const mockClient = {
    get: function<T>(
      _url: string, 
      _params?: Record<string, string> | { searchParams: Record<string, string> }
    ): Promise<HttpResponse<T>> {
      return Promise.resolve({
        data: [] as unknown as T,
        status: 200,
        headers: {}
      });
    },
    post: function<T, D = unknown>(
      _url: string, 
      _data?: D, 
      _params?: Record<string, string>
    ): Promise<HttpResponse<T>> {
      return Promise.resolve({
        data: {} as T,
        status: 200,
        headers: {}
      });
    }
  };
  
  // Spy on the methods to allow test verification
  jest.spyOn(mockClient, 'get');
  jest.spyOn(mockClient, 'post');
  
  return mockClient;
}

/**
 * Create a test container with mock services for testing
 * @param mockConsole Mock console object to use
 * @returns Configured dependency container
 */
export function createTestContainer(mockConsole: Console): DependencyContainer {
  // Create a new container
  const testContainer = container.createChildContainer();
  
  // Register mock console
  testContainer.register('ConsoleOutput', { useValue: mockConsole });
  
  // Register real services with mocked dependencies
  testContainer.register<StyleService>('StyleService', { useClass: PlainStyleService });
  testContainer.register<ShowFormatter>('ShowFormatter', { useClass: ConsoleFormatter });
  testContainer.register<TvShowService>('TvShowService', { useClass: TvShowServiceImpl });
  testContainer.register<OutputService>('OutputService', { useClass: ConsoleOutputService });
  
  // Register mock HTTP client
  testContainer.register<HttpClient>('HttpClient', { useValue: createMockHttpClient() });
  
  return testContainer;
}
