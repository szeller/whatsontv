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
  // We're using the MockHttpClient class directly as it has specific implementation
  // that's needed for tracking requests and handling fixtures
  const mockHttpClient = new MockHttpClient();
  
  // Set up GET errors first (they should take precedence)
  if (options.getErrors) {
    for (const [url, error] of Object.entries(options.getErrors)) {
      mockHttpClient.mockGetError(url, error);
    }
  }
  
  // Set up POST errors first (they should take precedence)
  if (options.postErrors) {
    for (const [url, error] of Object.entries(options.postErrors)) {
      mockHttpClient.mockPostError(url, error);
    }
  }
  
  // Set default error if provided
  if (options.defaultError) {
    mockHttpClient.setMockError(options.defaultError);
  }
  
  // Set up GET responses
  if (options.getResponses) {
    for (const [url, response] of Object.entries(options.getResponses)) {
      mockHttpClient.mockGet(url, response);
    }
  }
  
  // Set up POST responses
  if (options.postResponses) {
    for (const [url, response] of Object.entries(options.postResponses)) {
      mockHttpClient.mockPost(url, response);
    }
  }
  
  // Set default response if provided
  if (options.defaultResponse) {
    mockHttpClient.setMockResponse(options.defaultResponse);
  } else {
    // Set a default response if none is provided to prevent errors
    mockHttpClient.setMockResponse({
      data: { data: 'default data' },
      status: 200,
      headers: {}
    });
  }
  
  // Load fixtures
  if (options.fixtures) {
    for (const [url, fixture] of Object.entries(options.fixtures)) {
      mockHttpClient.mockFixture(url, fixture.path, fixture.status);
    }
  }
  
  // Apply any custom implementations
  if (options.implementation) {
    for (const [key, value] of Object.entries(options.implementation)) {
      // We need to cast here because we're dynamically setting properties
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockHttpClient as any)[key] = value;
    }
  }
  
  return mockHttpClient;
}
