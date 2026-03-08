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

  configureErrors(mockHttpClient, options);
  configureResponses(mockHttpClient, options);
  configureFixturesAndOverrides(mockHttpClient, options);

  return mockHttpClient;
}

/** Set up error responses on the mock client */
function configureErrors(client: MockHttpClient, options: HttpClientOptions): void {
  if (options.getErrors) {
    for (const [url, error] of Object.entries(options.getErrors)) {
      client.mockGetError(url, error);
    }
  }
  if (options.postErrors) {
    for (const [url, error] of Object.entries(options.postErrors)) {
      client.mockPostError(url, error);
    }
  }
  if (options.defaultError) {
    client.setMockError(options.defaultError);
  }
}

/** Set up success responses on the mock client */
function configureResponses(client: MockHttpClient, options: HttpClientOptions): void {
  if (options.getResponses) {
    for (const [url, response] of Object.entries(options.getResponses)) {
      client.mockGet(url, response);
    }
  }
  if (options.postResponses) {
    for (const [url, response] of Object.entries(options.postResponses)) {
      client.mockPost(url, response);
    }
  }
  if (options.defaultResponse) {
    client.setMockResponse(options.defaultResponse);
  } else {
    client.setMockResponse({ data: { data: 'default data' }, status: 200, headers: {} });
  }
}

/** Load fixtures and apply custom implementations */
function configureFixturesAndOverrides(
  client: MockHttpClient, options: HttpClientOptions
): void {
  if (options.fixtures) {
    for (const [url, fixture] of Object.entries(options.fixtures)) {
      client.mockFixture(url, fixture.path, fixture.status);
    }
  }
  if (options.implementation) {
    for (const [key, value] of Object.entries(options.implementation)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (client as any)[key] = value;
    }
  }
}
