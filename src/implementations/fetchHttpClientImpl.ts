/**
 * Ky HTTP Client Implementation
 * 
 * An implementation of the HttpClient interface using the Ky library
 * for better ESM compatibility and reduced external dependencies.
 */

import 'reflect-metadata';
import { injectable } from 'tsyringe';
import ky, { Options as KyOptions, Hooks } from 'ky';
import type { HttpClient } from '../interfaces/httpClient.js';
import type { ZodType, ZodTypeDef } from 'zod';

/**
 * Request options for HTTP client
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  query?: Record<string, string | number | boolean>;
}

/**
 * Options for configuring the KyHttpClient
 */
export interface KyHttpClientOptions {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
  hooks?: Hooks;
}

/**
 * Implementation of the HttpClient interface using the Ky library
 */
@injectable()
export class FetchHttpClientImpl implements HttpClient {
  private readonly kyInstance: typeof ky;
  private readonly isTestEnvironment: boolean;

  /**
   * Creates a new Ky HTTP client
   * @param options Client configuration options
   */
  constructor(options: KyHttpClientOptions = {}) {
    const prefixUrl = options.baseUrl !== undefined ? options.baseUrl : '';
    const timeout = options.timeout !== undefined ? options.timeout : 30000;
    const headers = options.headers !== undefined ? options.headers : {};
    
    this.isTestEnvironment = process.env.NODE_ENV === 'test' || 
                             process.env.JEST_WORKER_ID !== undefined;
    
    // Create a configured instance of ky
    this.kyInstance = ky.create({
      prefixUrl,
      timeout,
      headers,
      retry: 0, // Don't retry by default
      hooks: {
        beforeRequest: [
          request => {
            if (!this.isTestEnvironment) {
              console.warn(`Making request to: ${request.url}`);
            }
          },
          ...(options.hooks?.beforeRequest || [])
        ],
        afterResponse: [
          (_request, _options, response) => {
            if (!this.isTestEnvironment && !response.ok) {
              console.error(`Error response: ${response.status} ${response.statusText}`);
            }
            return response;
          },
          ...(options.hooks?.afterResponse || [])
        ],
        beforeError: [
          ...(options.hooks?.beforeError || [])
        ]
      }
    });
  }

  /**
   * Convert RequestOptions to Ky options
   * @param options Request options
   * @returns Ky options
   */
  private convertOptions(options: RequestOptions | undefined): KyOptions {
    if (options === undefined) {
      return {};
    }
    
    const kyOptions: KyOptions = {};
    
    if (options.headers !== undefined) {
      kyOptions.headers = options.headers;
    }
    
    if (options.timeout !== undefined && options.timeout > 0) {
      kyOptions.timeout = options.timeout;
    }
    
    if (options.query !== undefined) {
      const searchParams = new URLSearchParams();
      
      Object.entries(options.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      if (searchParams.toString() !== '') {
        kyOptions.searchParams = searchParams;
      }
    }
    
    return kyOptions;
  }

  /**
   * Make a GET request
   * @param url The URL to request
   * @param options Optional request options
   * @param schema Optional schema for validation
   * @returns Promise resolving to the response
   */
  async get<T>(
    url: string, 
    options?: RequestOptions,
    schema?: ZodType<T, ZodTypeDef, unknown>
  ): Promise<T> {
    try {
      const kyOptions = this.convertOptions(options);
      const response = await this.kyInstance.get(url, kyOptions).json<unknown>();
      
      // Validate with schema if provided
      if (schema !== undefined) {
        return schema.parse(response);
      }
      
      return response as T;
    } catch (error) {
      if (!this.isTestEnvironment) {
        console.error('GET request error:', error);
      }
      
      if (error instanceof Error) {
        throw new Error(`GET request failed: ${error.message}`);
      }
      
      throw new Error(`GET request failed: ${String(error)}`);
    }
  }

  /**
   * Make a POST request
   * @param url The URL to request
   * @param data Optional request body
   * @param options Optional request options
   * @param schema Optional schema for validation
   * @returns Promise resolving to the response
   */
  async post<T, D = unknown>(
    url: string, 
    data?: D, 
    options?: RequestOptions,
    schema?: ZodType<T, ZodTypeDef, unknown>
  ): Promise<T> {
    try {
      const kyOptions = this.convertOptions(options);
      
      // Add JSON body if data is provided
      if (data !== undefined) {
        kyOptions.json = data;
      }
      
      const response = await this.kyInstance.post(url, kyOptions).json<unknown>();
      
      // Validate with schema if provided
      if (schema !== undefined) {
        return schema.parse(response);
      }
      
      return response as T;
    } catch (error) {
      if (!this.isTestEnvironment) {
        console.error('POST request error:', error);
      }
      
      if (error instanceof Error) {
        throw new Error(`POST request failed: ${error.message}`);
      }
      
      throw new Error(`POST request failed: ${String(error)}`);
    }
  }
}
