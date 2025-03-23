import 'reflect-metadata';
import got, { Got, Options as GotOptions, Response } from 'got';
import { injectable } from 'tsyringe';

import { HttpClient, HttpClientOptions, HttpResponse } from '../interfaces/httpClient.js';

/**
 * Implementation of the HttpClient interface using Got
 */
@injectable()
export class GotHttpClientImpl implements HttpClient {
  private client: Got;
  private isTestEnvironment: boolean;

  /**
   * Creates a new Got HTTP client
   * @param options Client configuration options
   */
  constructor(options: HttpClientOptions = {}) {
    const gotOptions: Partial<GotOptions> = {
      prefixUrl: options.baseUrl ?? '',
      timeout: {
        request: options.timeout ?? 30000
      },
      headers: options.headers ?? {},
      throwHttpErrors: false, // We'll handle errors ourselves
      responseType: 'text' // Get raw text response and parse JSON manually
    };

    // Use type assertion to handle the type mismatch between actual Got and our mock in tests
    this.client = got.extend(gotOptions) as unknown as Got;
    // Check if we're in a test environment
    this.isTestEnvironment = process.env.NODE_ENV === 'test' || 
                             process.env.JEST_WORKER_ID !== undefined;
  }

  /**
   * Log a message if not in test environment
   * @param level Log level
   * @param message Message to log
   * @param data Optional data to log
   */
  private log(level: 'log' | 'error', message: string, data?: unknown): void {
    if (!this.isTestEnvironment) {
      if (level === 'log') {
        if (data !== undefined) {
          console.warn(message, data);
        } else {
          console.warn(message);
        }
      } else {
        if (data !== undefined) {
          console.error(message, data);
        } else {
          console.error(message);
        }
      }
    }
  }

  /**
   * Make a GET request
   * @param url The URL to request
   * @param params Optional query parameters
   * @returns Promise resolving to the response
   */
  async get<T>(url: string, params?: Record<string, string>): Promise<HttpResponse<T>> {
    try {
      // Remove leading slash if present (Got's prefixUrl requires this)
      const normalizedUrl = url.startsWith('/') ? url.slice(1) : url;
      this.log('log', `Making GET request to: ${normalizedUrl}`);
      
      // Type assertion for the response
      const response = await this.client.get(normalizedUrl, {
        searchParams: params
      }) as Response<string>;
      
      // Check for error status codes
      if (response.statusCode >= 400) {
        throw new Error(`HTTP Error ${response.statusCode}: ${
          response.statusCode === 404 ? 'Not Found' : 'Request failed'
        }`);
      }
      
      return this.transformResponse<T>(response);
    } catch (error) {
      this.log('error', 'GET request error:', error);
      
      // If the error is from Got and has a response property, handle it
      if (error !== null && typeof error === 'object' && 'response' in error) {
        const errorResponse = error.response as Response;
        if (
          errorResponse !== null && 
          typeof errorResponse === 'object' && 
          'statusCode' in errorResponse && 
          errorResponse.statusCode !== undefined
        ) {
          const statusCode = errorResponse.statusCode;
          const statusText = typeof errorResponse.body === 'string' ? 
            errorResponse.body : 'Not Found';
          throw new Error(
            `Request Error: HTTP Error ${statusCode}: ${statusText}`
          );
        }
      }
      
      // Check if the error message already contains HTTP Error
      if (error instanceof Error && error.message.includes('HTTP Error')) {
        throw new Error(`Request Error: ${error.message}`);
      }
      
      // For network errors or other types of errors, use our generic handler
      throw new Error(`Network Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Make a POST request
   * @param url The URL to request
   * @param data Optional request body
   * @param params Optional query parameters
   * @returns Promise resolving to the response
   */
  async post<T, D = unknown>(
    url: string, 
    data?: D, 
    params?: Record<string, string>
  ): Promise<HttpResponse<T>> {
    try {
      // Remove leading slash if present (Got's prefixUrl requires this)
      const normalizedUrl = url.startsWith('/') ? url.slice(1) : url;
      this.log('log', `Making POST request to: ${normalizedUrl}`);
      
      // Type assertion for the response
      const response = await this.client.post(normalizedUrl, {
        json: data,
        searchParams: params
      }) as Response<string>;
      
      // Check for error status codes
      if (response.statusCode >= 400) {
        throw new Error(`HTTP Error ${response.statusCode}: ${
          response.statusCode === 404 ? 'Not Found' : 'Request failed'
        }`);
      }
      
      return this.transformResponse<T>(response);
    } catch (error) {
      this.log('error', 'POST request error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Transform Got response to our HttpResponse format
   * @param response The Got response
   * @returns Transformed response
   */
  private transformResponse<T>(response: Response): HttpResponse<T> {
    try {
      // Get the content type from the headers
      const contentType = response.headers['content-type'] || '';
      const responseBody = String(response.body); // Convert to string explicitly
      
      const data: T = contentType.includes('application/json')
        ? JSON.parse(responseBody) as T
        : response.body as unknown as T;
      
      return {
        data,
        status: response.statusCode,
        headers: response.headers as unknown as Record<string, string>
      };
    } catch (error) {
      this.log('error', 'Error transforming response:', error);
      // For parsing errors, just return the raw body
      return {
        data: response.body as unknown as T,
        status: response.statusCode,
        headers: response.headers as unknown as Record<string, string>
      };
    }
  }

  /**
   * Handle errors from Got requests
   * @param error The error from Got
   * @returns A standardized error
   */
  private handleError(error: unknown): Error {
    this.log('error', 'Handling error:', error);
    
    if (error !== null && error !== undefined && typeof error === 'object') {
      // Handle Got errors
      if ('response' in error && error.response !== null && error.response !== undefined) {
        const response = error.response as Response;
        const statusText = typeof response.body === 'string' ? 
          response.body : 'Not Found';
        return new Error(
          `Request Error: HTTP Error ${response.statusCode}: ${statusText}`
        );
      }
      
      // Handle HTTP errors that are already formatted
      if (error instanceof Error && error.message.includes('HTTP Error')) {
        return new Error(`Request Error: ${error.message}`);
      }
      
      // Handle network errors
      if ('code' in error && typeof error.code === 'string' && error.code !== '') {
        return new Error(`Network Error: ${error.code}`);
      }
    }
    
    // Handle any other errors
    return new Error(`Network Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
