import { HttpClient, HttpResponse } from '../../utils/httpClient.js';

/**
 * Mock HTTP client for testing
 * Allows setting up mock responses and errors for specific URLs
 */
export class MockHttpClient implements HttpClient {
  private mockResponses = new Map<string, HttpResponse<unknown>>();
  private mockErrors = new Map<string, Error>();

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
   * Mock implementation of GET
   * @param url The URL to request
   * @param _params Optional query parameters (ignored in mock)
   * @returns Promise resolving to the mock response
   */
  async get<T>(url: string, _params?: Record<string, string>): Promise<HttpResponse<T>> {
    if (this.mockErrors.has(url)) {
      throw this.mockErrors.get(url)!;
    }
    if (this.mockResponses.has(url)) {
      return this.mockResponses.get(url) as HttpResponse<T>;
    }
    throw new Error(`No mock response for GET ${url}`);
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
    const key = `POST:${url}`;
    if (this.mockErrors.has(key)) {
      throw this.mockErrors.get(key)!;
    }
    if (this.mockResponses.has(key)) {
      return this.mockResponses.get(key) as HttpResponse<T>;
    }
    throw new Error(`No mock response for POST ${url}`);
  }
}
