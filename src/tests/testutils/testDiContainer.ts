/**
 * Test container setup for dependency injection tests
 * Provides a configured container with mock services
 */

import 'reflect-metadata';
import { jest } from '@jest/globals';
import { container, DependencyContainer } from 'tsyringe';

import { TextShowFormatterImpl } from '../../implementations/console/textShowFormatterImpl.js';
import { ConsoleOutputServiceImpl } from 
  '../../implementations/console/consoleOutputServiceImpl.js';
import { TvMazeServiceImpl } from '../../implementations/tvMazeServiceImpl.js';
import { PlainStyleServiceImpl } from '../../implementations/test/plainStyleServiceImpl.js';
import { MockLoggerServiceImpl } from '../../implementations/test/mockLoggerServiceImpl.js';

import type { HttpClient, HttpResponse } from '../../interfaces/httpClient.js';

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
  testContainer.register('StyleService', { useClass: PlainStyleServiceImpl });
  testContainer.register('ShowFormatter', { useClass: TextShowFormatterImpl });
  testContainer.register('TvShowService', { useClass: TvMazeServiceImpl });
  testContainer.register('OutputService', { useClass: ConsoleOutputServiceImpl });
  
  // Register mock HTTP client and logger
  testContainer.register('HttpClient', { useValue: createMockHttpClient() });
  testContainer.register('LoggerService', { useClass: MockLoggerServiceImpl });
  
  return testContainer;
}
