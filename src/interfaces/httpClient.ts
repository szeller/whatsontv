/**
 * HTTP client interface for making API requests
 * This abstraction allows for different implementations (Axios, Got, etc.) 
 * while maintaining a consistent API for the application
 */
import { z } from 'zod';

export interface HttpClientOptions {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface HttpResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  // Allow any additional custom properties
  [key: string]: unknown;
}

/**
 * HTTP client interface for making API requests
 */
export interface HttpClient {
  /**
   * Make a GET request
   * @param url The URL to request
   * @param options Optional request options
   * @param schema Optional Zod schema to validate the response
   * @returns Promise resolving to the response
   */
  get<T>(
    url: string, 
    options?: RequestOptions,
    schema?: z.ZodType
  ): Promise<HttpResponse<T>>;

  /**
   * Make a POST request
   * @param url The URL to request
   * @param data Optional request body
   * @param options Optional request options
   * @param schema Optional Zod schema to validate the response
   * @returns Promise resolving to the response
   */
  post<T, D = unknown>(
    url: string, 
    data?: D, 
    options?: RequestOptions,
    schema?: z.ZodType
  ): Promise<HttpResponse<T>>;
}
