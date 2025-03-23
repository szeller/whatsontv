/**
 * HTTP client interface for making API requests
 * This abstraction allows for different implementations (Axios, Got, etc.) 
 * while maintaining a consistent API for the application
 */

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

/**
 * HTTP client interface for making API requests
 */
export interface HttpClient {
  /**
   * Make a GET request
   * @param url The URL to request
   * @param params Optional query parameters
   * @returns Promise resolving to the response
   */
  get<T>(
    url: string, 
    params?: Record<string, string>
  ): Promise<HttpResponse<T>>;

  /**
   * Make a POST request
   * @param url The URL to request
   * @param data Optional request body
   * @param params Optional query parameters
   * @returns Promise resolving to the response
   */
  post<T, D = unknown>(
    url: string, 
    data?: D, 
    params?: Record<string, string>
  ): Promise<HttpResponse<T>>;
}
