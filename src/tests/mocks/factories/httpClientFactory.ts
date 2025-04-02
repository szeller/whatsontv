import { MockHttpClient } from '../../testutils/mockHttpClient.js';
import type { HttpClient, HttpResponse } from '../../../interfaces/httpClient.js';
import { MockOptions } from './types.js';

/**
 * Options for creating a mock HTTP client
 */
export interface HttpClientOptions extends MockOptions<HttpClient> {
  /** Default response to return for any request */
  defaultResponse?: HttpResponse<unknown>;
  
  /** Default error to throw for any request */
  defaultError?: Error;
  
  /** Predefined GET responses by URL */
  getResponses?: Record<string, HttpResponse<unknown>>;
  
  /** Predefined GET errors by URL */
  getErrors?: Record<string, Error>;
  
  /** Predefined POST responses by URL */
  postResponses?: Record<string, HttpResponse<unknown>>;
  
  /** Predefined POST errors by URL */
  postErrors?: Record<string, Error>;
  
  /** Fixture files to load as responses (key: URL, value: fixture path) */
  fixtures?: Record<string, { path: string; status?: number }>;
}

/**
 * Creates a mock HTTP client for testing
 * @param options Options for configuring the mock
 * @returns A mock HTTP client instance
 */
export function createMockHttpClient(options: HttpClientOptions = {}): MockHttpClient {
  const mockHttpClient = new MockHttpClient();
  
  // Set default response/error if provided
  if (options.defaultResponse) {
    mockHttpClient.setMockResponse(options.defaultResponse);
  }
  
  if (options.defaultError) {
    mockHttpClient.setMockError(options.defaultError);
  }
  
  // Set up GET responses
  if (options.getResponses) {
    Object.entries(options.getResponses).forEach(([url, response]) => {
      mockHttpClient.mockGet(url, response);
    });
  }
  
  // Set up GET errors
  if (options.getErrors) {
    Object.entries(options.getErrors).forEach(([url, error]) => {
      mockHttpClient.mockGetError(url, error);
    });
  }
  
  // Set up POST responses
  if (options.postResponses) {
    Object.entries(options.postResponses).forEach(([url, response]) => {
      mockHttpClient.mockPost(url, response);
    });
  }
  
  // Set up POST errors
  if (options.postErrors) {
    Object.entries(options.postErrors).forEach(([url, error]) => {
      mockHttpClient.mockPostError(url, error);
    });
  }
  
  // Load fixtures
  if (options.fixtures) {
    Object.entries(options.fixtures).forEach(([url, fixture]) => {
      mockHttpClient.mockFixture(url, fixture.path, fixture.status);
    });
  }
  
  return mockHttpClient;
}
