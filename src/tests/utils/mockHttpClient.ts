import type { HttpClient, HttpResponse } from '../../interfaces/httpClient.js';
import { setTimeout } from 'timers/promises';

/**
 * Mock HTTP client for testing
 * Allows setting up mock responses and errors for specific URLs
 */
export class MockHttpClient implements HttpClient {
  private mockResponses = new Map<string, HttpResponse<unknown>>();
  private mockErrors = new Map<string, Error>();
  
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
  }

  /**
   * Set up a mock GET error
   * @param url The URL to mock
   * @param error The error to throw
   */
  mockGetError(url: string, error: Error): void {
    this.mockErrors.set(url, error);
  }

  /**
   * Set up a mock POST response
   * @param url The URL to mock
   * @param response The response to return
   */
  mockPost<T>(url: string, response: HttpResponse<T>): void {
    this.mockResponses.set(`POST:${url}`, response as HttpResponse<unknown>);
  }

  /**
   * Set up a mock POST error
   * @param url The URL to mock
   * @param error The error to throw
   */
  mockPostError(url: string, error: Error): void {
    this.mockErrors.set(`POST:${url}`, error);
  }

  /**
   * Set a mock response for any request
   * @param response The response to return
   */
  setMockResponse<T>(response: HttpResponse<T>): void {
    // This will be used as a default response for any URL
    this.mockResponses.set('*', response as HttpResponse<unknown>);
  }

  /**
   * Set a mock error for any request
   * @param error The error to throw
   */
  setMockError(error: Error): void {
    // This will be used as a default error for any URL
    this.mockErrors.set('*', error);
  }

  /**
   * Mock implementation of GET
   * @param url The URL to request
   * @param _params Optional query parameters (ignored in mock)
   * @returns Promise resolving to the mock response
   */
  async get<T>(url: string, _params?: Record<string, string>): Promise<HttpResponse<T>> {
    // Track the last URL requested
    this.lastUrl = url;
    
    // Add a small delay to simulate network latency
    await setTimeout(1);
    
    if (this.mockErrors.has(url)) {
      throw this.mockErrors.get(url)!;
    }
    if (this.mockResponses.has(url)) {
      return this.mockResponses.get(url) as HttpResponse<T>;
    }
    if (this.mockResponses.has('*')) {
      return this.mockResponses.get('*') as HttpResponse<T>;
    }
    if (this.mockErrors.has('*')) {
      throw this.mockErrors.get('*')!;
    }
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
    // Track the last URL requested
    this.lastUrl = url;
    
    // Add a small delay to simulate network latency
    await setTimeout(1);
    
    const postUrl = `POST:${url}`;
    if (this.mockErrors.has(postUrl)) {
      throw this.mockErrors.get(postUrl)!;
    }
    if (this.mockResponses.has(postUrl)) {
      return this.mockResponses.get(postUrl) as HttpResponse<T>;
    }
    if (this.mockResponses.has('*')) {
      return this.mockResponses.get('*') as HttpResponse<T>;
    }
    if (this.mockErrors.has('*')) {
      throw this.mockErrors.get('*')!;
    }
    throw new Error(`No mock response or error set for URL: ${url}`);
  }
}
