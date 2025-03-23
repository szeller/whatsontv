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
        console.warn(message, data);
      } else {
        console.error(message, data);
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
      }) as unknown as Response<string>;
      
      // Check for error status codes
      if (response.statusCode >= 400) {
        throw { response };
      }
      
      return this.transformResponse<T>(response);
    } catch (error) {
      this.log('error', 'GET request error:', error);
      throw this.handleError(error);
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
      }) as unknown as Response<string>;
      
      // Check for error status codes
      if (response.statusCode >= 400) {
        throw { response };
      }
      
      return this.transformResponse<T>(response);
    } catch (error) {
      this.log('error', 'POST request error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Transform a Got response to our standard HttpResponse format
   * @param response The Got response
   * @returns Standardized HTTP response
   */
  private transformResponse<T>(response: Response<string>): HttpResponse<T> {
    let data: T;
    
    try {
      // Check content type to determine how to handle the response
      const contentType = response.headers['content-type'] ?? '';
      
      // Convert if/else to ternary expression
      data = contentType.includes('application/json')
        ? JSON.parse(response.body) as T
        : response.body as unknown as T;
      
      return {
        data,
        status: response.statusCode,
        headers: response.headers as Record<string, string>
      };
    } catch (error) {
      this.log('error', 'Error transforming response:', error);
      // For parsing errors, just return the raw body
      return {
        data: response.body as unknown as T,
        status: response.statusCode,
        headers: response.headers as Record<string, string>
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
        return new Error(`HTTP Error: ${response.statusCode}`);
      }
      
      // Handle network errors
      if ('code' in error && typeof error.code === 'string' && error.code !== '') {
        return new Error(`Network Error: ${error.code}`);
      }
      
      // Handle other errors with message property
      if ('message' in error && typeof error.message === 'string' && error.message !== '') {
        return new Error(`Request Error: ${error.message}`);
      }
    }
    
    // Fallback for unknown errors
    return new Error('Unknown error occurred');
  }
}
