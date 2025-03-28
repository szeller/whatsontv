import 'reflect-metadata';
import got, { Got, Options as GotOptions, Response, SearchParameters } from 'got';
import { injectable } from 'tsyringe';
import { z } from 'zod';

import { 
  HttpClient, 
  HttpClientOptions, 
  HttpResponse, 
  RequestOptions 
} from '../interfaces/httpClient.js';
import { validateData } from '../utils/validationUtils.js';

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
   * Build Got options from our RequestOptions
   * @param options Our request options
   * @returns Got options
   */
  private buildOptions(options?: RequestOptions): Partial<GotOptions> {
    if (!options) {
      return {};
    }

    const gotOptions: Partial<GotOptions> = {};
    
    if (options.headers) {
      gotOptions.headers = options.headers;
    }
    
    // Ensure timeout is a positive number before using it
    if (options.timeout !== undefined && 
        options.timeout !== null && 
        typeof options.timeout === 'number' && 
        options.timeout > 0) {
      gotOptions.timeout = {
        request: options.timeout
      };
    }
    
    // Extract custom parameters for searchParams
    const searchParams: SearchParameters = {};
    Object.keys(options).forEach(key => {
      if (key !== 'headers' && key !== 'timeout') {
        searchParams[key] = options[key] as string | number | boolean;
      }
    });
    
    // Add any remaining properties as searchParams (query parameters)
    if (Object.keys(searchParams).length > 0) {
      gotOptions.searchParams = searchParams;
    }
    
    return gotOptions;
  }

  /**
   * Make a GET request
   * @param url The URL to request
   * @param options Optional request options
   * @param schema Optional Zod schema to validate the response
   * @returns Promise resolving to the response
   */
  async get<T>(
    url: string, 
    options?: RequestOptions,
    schema?: z.ZodType<T>
  ): Promise<HttpResponse<T>> {
    try {
      // Remove leading slash if present (Got's prefixUrl requires this)
      const normalizedUrl = url.startsWith('/') ? url.slice(1) : url;
      
      this.log('log', `Making GET request to: ${normalizedUrl}`);
      
      const response = await this.client.get(normalizedUrl, this.buildOptions(options));
      
      // Cast to Response<string> for type safety
      const typedResponse = response as unknown as Response<string>;
      
      // Check for error status codes (handle null/undefined case explicitly)
      if (typedResponse.statusCode !== undefined && 
          typedResponse.statusCode !== null && 
          typeof typedResponse.statusCode === 'number' &&
          typedResponse.statusCode > 0 && 
          typedResponse.statusCode >= 400) {
        throw new Error(`HTTP Error ${typedResponse.statusCode}: ${
          typedResponse.statusCode === 404 ? 'Not Found' : 'Request failed'
        }`);
      }
      
      return this.transformResponse<T>(typedResponse, schema);
    } catch (error) {
      this.log('error', 'GET request error:', error);
      
      // If the error is from Got and has a response property, handle it
      if (error !== null && typeof error === 'object' && 'response' in error) {
        const errorResponse = error.response as unknown as Response;
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
      throw new Error(
        `Network Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Make a POST request
   * @param url The URL to request
   * @param data Optional request body
   * @param options Optional request options
   * @param schema Optional Zod schema to validate the response
   * @returns Promise resolving to the response
   */
  async post<T, D = unknown>(
    url: string, 
    data?: D, 
    options?: RequestOptions,
    schema?: z.ZodType<T>
  ): Promise<HttpResponse<T>> {
    try {
      // Remove leading slash if present (Got's prefixUrl requires this)
      const normalizedUrl = url.startsWith('/') ? url.slice(1) : url;
      
      this.log('log', `Making POST request to: ${normalizedUrl}`);
      
      const gotOptions = this.buildOptions(options);
      
      // Add JSON body if data is provided
      if (data !== undefined) {
        gotOptions.json = data;
      }
      
      const response = await this.client.post(normalizedUrl, gotOptions);
      
      // Cast to Response<string> for type safety
      const typedResponse = response as unknown as Response<string>;
      
      // Check for error status codes (handle null/undefined case explicitly)
      if (typedResponse.statusCode !== undefined && 
          typedResponse.statusCode !== null && 
          typeof typedResponse.statusCode === 'number' &&
          typedResponse.statusCode > 0 && 
          typedResponse.statusCode >= 400) {
        throw new Error(`HTTP Error ${typedResponse.statusCode}: ${
          typedResponse.statusCode === 404 ? 'Not Found' : 'Request failed'
        }`);
      }
      
      return this.transformResponse<T>(typedResponse, schema);
    } catch (error) {
      this.log('error', 'POST request error:', error);
      
      // Handle errors using our common error handler
      throw this.handleError(error);
    }
  }

  /**
   * Transform a Got response to our HttpResponse
   * @param response The Got response
   * @param schema Optional Zod schema to validate the response
   * @returns Our HttpResponse
   */
  private transformResponse<T>(
    response: Response<string>, 
    schema?: z.ZodType<T>
  ): HttpResponse<T> {
    try {
      // Parse the response body as JSON
      let parsedData: unknown;
      try {
        parsedData = JSON.parse(response.body);
      } catch (_) {
        // If it's not valid JSON, use the raw body
        parsedData = response.body;
      }
      
      // If a schema is provided, validate the response
      if (schema) {
        // validateData returns the validated data with the correct type
        const validatedData = validateData(
          schema, 
          parsedData, 
          'Invalid response from API'
        );
        
        // Create a properly typed response
        return {
          data: validatedData,
          status: response.statusCode,
          headers: response.headers as Record<string, string>
        };
      }
      
      // No schema validation, just return the parsed data
      return {
        data: parsedData as T,
        status: response.statusCode,
        headers: response.headers as Record<string, string>
      };
    } catch (error) {
      this.log('error', 'Error transforming response:', error);
      
      // For parsing errors, just return the raw body
      return {
        data: response.body as T,
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
        const response = error.response as unknown as Response;
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
    return new Error(
      `Network Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
