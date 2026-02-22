import type { HttpClient, HttpResponse } from '../../interfaces/httpClient.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

// Get the directory path for fixtures
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, '../fixtures/tvmaze');

/**
 * Mock HTTP client for testing
 * Allows setting up mock responses and errors for specific URLs
 */
export class MockHttpClient implements HttpClient {
  private readonly mockResponses = new Map<string, HttpResponse<unknown>>();
  private readonly mockErrors = new Map<string, Error>();
  private requests: string[] = [];
  private readonly requestCounts = new Map<string, number>();
  
  /**
   * Jest mock functions for direct control in tests
   */
  public getMock = jest.fn<
    (url: string, params?: Record<string, string>) => Promise<HttpResponse<unknown>>
  >();
  
  public postMock = jest.fn<
    (
      url: string, 
      data?: unknown, 
      params?: Record<string, string>
    ) => Promise<HttpResponse<unknown>>
  >();
  
  /**
   * Tracks the last URL that was requested
   */
  public lastUrl = '';

  /**
   * Set up a mock GET response
   * @param url The URL to mock
   * @param response The response to return
   */
  mockGet<T>(url: string, response: HttpResponse<T>): void {
    this.mockResponses.set(url, response as HttpResponse<unknown>);
    this.getMock.mockResolvedValue(response);
  }

  /**
   * Set up a mock GET error
   * @param url The URL to mock
   * @param error The error to throw
   */
  mockGetError(url: string, error: Error): void {
    this.mockErrors.set(url, error);
    this.getMock.mockRejectedValue(error);
  }

  /**
   * Set up a mock POST response
   * @param url The URL to mock
   * @param response The response to return
   */
  mockPost<T>(url: string, response: HttpResponse<T>): void {
    this.mockResponses.set(url, response);
    this.postMock.mockResolvedValue(response);
  }

  /**
   * Set up a mock POST error
   * @param url The URL to mock
   * @param error The error to throw
   */
  mockPostError(url: string, error: Error): void {
    this.mockErrors.set(url, error);
    this.postMock.mockRejectedValue(error);
  }

  /**
   * Set a mock response for any request
   * @param response The response to return
   */
  setMockResponse<T>(response: HttpResponse<T>): void {
    // This will be used as a default response for any URL
    this.mockResponses.set('*', response as HttpResponse<unknown>);
    this.getMock.mockResolvedValue(response);
    this.postMock.mockResolvedValue(response);
  }

  /**
   * Set a mock error for any request
   * @param error The error to throw
   */
  setMockError(error: Error): void {
    // This will be used as a default error for any URL
    this.mockErrors.set('*', error);
    this.getMock.mockRejectedValue(error);
    this.postMock.mockRejectedValue(error);
  }

  /**
   * Load a fixture file as a mock response
   * @param url URL to mock
   * @param fixturePath Path to fixture file (relative to fixtures directory)
   * @param status HTTP status code to return
   */
  mockFixture(url: string, fixturePath: string, status = 200): void {
    const fullPath = path.join(fixturesDir, fixturePath);
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    
    this.mockResponses.set(url, {
      status,
      headers: {},
      data
    });
    this.getMock.mockResolvedValue({
      status,
      headers: {},
      data
    });
  }

  /**
   * Get the list of requested URLs
   * @returns Array of requested URLs
   */
  getRequests(): string[] {
    return [...this.requests];
  }

  /**
   * Get the number of times a specific URL has been requested
   * @param url The URL to check
   * @returns The number of times the URL has been requested
   */
  getCallCount(url: string): number {
    return this.requestCounts.get(url) ?? 0;
  }

  /**
   * Clear all mocks and requests
   */
  reset(): void {
    this.mockResponses.clear();
    this.mockErrors.clear();
    this.requests = [];
    this.requestCounts.clear();
    this.lastUrl = '';
    this.getMock.mockReset();
    this.postMock.mockReset();
  }

  /**
   * Track a request to a URL
   * @param url The URL being requested
   */
  private trackRequest(url: string): void {
    this.lastUrl = url;
    this.requests.push(url);
    
    // Get current count and increment
    const currentCount = this.requestCounts.get(url) ?? 0;
    this.requestCounts.set(url, currentCount + 1);
  }

  /**
   * Mock implementation of GET
   * @param url The URL to request
   * @param _params Optional query parameters (ignored in mock)
   * @returns Promise resolving to the mock response
   */
  async get<T>(url: string, _params?: Record<string, string>): Promise<HttpResponse<T>> {
    // Track this request
    this.trackRequest(url);
    
    // Check if we have a mock error for this URL - this should take precedence
    if (this.mockErrors.has(url)) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw this.mockErrors.get(url);
    }

    // Check if we have a mock response for this URL
    if (this.mockResponses.has(url)) {
      return this.mockResponses.get(url) as HttpResponse<T>;
    }

    // Check if we have a mock error for any URL
    if (this.mockErrors.has('*')) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw this.mockErrors.get('*');
    }

    // Check if we have a mock response for any URL
    if (this.mockResponses.has('*')) {
      return this.mockResponses.get('*') as HttpResponse<T>;
    }

    // If the mock function has been set up with mockGet/mockGetError, use it
    if (this.getMock.mock.calls.length > 0) {
      return await this.getMock(url, _params) as HttpResponse<T>;
    }

    // Throw error if no mock is set up
    throw new Error(`No mock response or error set for URL: ${url}`);
  }

  /**
   * Mock implementation of POST
   * @param url The URL to request
   * @param _data Optional request body (ignored in mock)
   * @param _params Optional query parameters (ignored in mock)
   * @returns Promise resolving to the mock response
   */
  async post<T, D = unknown>(
    url: string,
    _data?: D,
    _params?: Record<string, string>
  ): Promise<HttpResponse<T>> {
    // Track this request
    this.trackRequest(url);

    // Check if we have a mock error for this URL - this should take precedence
    if (this.mockErrors.has(url)) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw this.mockErrors.get(url);
    }

    // Check if we have a mock response for this URL
    if (this.mockResponses.has(url)) {
      return this.mockResponses.get(url) as HttpResponse<T>;
    }

    // Check if we have a mock error for any URL
    if (this.mockErrors.has('*')) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw this.mockErrors.get('*');
    }
    
    // Check if we have a mock response for any URL
    if (this.mockResponses.has('*')) {
      return this.mockResponses.get('*') as HttpResponse<T>;
    }
    
    // If the mock function has been set up with mockPost/mockPostError, use it
    if (this.postMock.mock.calls.length > 0) {
      return await this.postMock(url, _data, _params) as HttpResponse<T>;
    }
    
    // Throw error if no mock is set up
    throw new Error(`No mock response or error set for URL: ${url}`);
  }
}
