# Axios to Got Migration Plan

## Overview

This document outlines the plan to migrate from Axios to Got for HTTP requests in the WhatsOnTV application, as specified in issue #13. The migration will be implemented in phases, focusing on maintaining functionality while introducing an abstraction layer that will make the eventual transition to Got smoother.

## Current Status

- **HTTP Client**: Currently using Axios v1.8.3 directly in `tvShowService.ts`
- **API Integration**: TVMaze API for fetching TV show data
- **Test Implementation**: Using axios-mock-adapter for mocking API responses

## Migration Strategy

### Phase 1: HTTP Client Abstraction with Axios (2-3 days)

1. **Create HTTP Client Interface**
   - Define a clear abstraction for HTTP operations
   - Implement with Axios initially
   - Design with future Got migration in mind

2. **Refactor Existing Code**
   - Update `tvShowService.ts` to use the new abstraction
   - Maintain all existing functionality
   - Ensure type safety throughout

3. **Update Tests**
   - Create tests for the new HTTP client
   - Update existing tests to use the abstraction
   - Maintain test coverage for modified code

### Phase 2: Got Implementation (2-3 days)

1. **Implement Got-based Client**
   - Create a Got implementation of the HTTP client interface
   - Handle response parsing and error management
   - Ensure compatibility with existing code

2. **Switch Implementation**
   - Replace Axios implementation with Got
   - Verify all functionality works as expected
   - Address any Got-specific behaviors

3. **Test Validation**
   - Update test mocks for Got
   - Verify all tests pass with the new implementation
   - Add tests for Got-specific features

### Phase 3: Cleanup and Documentation (1-2 days)

1. **Remove Axios Dependencies**
   - Remove axios and axios-mock-adapter packages
   - Clean up any remaining Axios-specific code
   - Update package.json

2. **Documentation**
   - Update API documentation
   - Document the HTTP client abstraction
   - Create usage examples

3. **Final Review**
   - Code quality review
   - Performance testing
   - Final PR preparation

## Implementation Details

### HTTP Client Interface

```typescript
// src/utils/httpClient.ts
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

export interface HttpClient {
  get<T>(url: string, params?: Record<string, string>): Promise<HttpResponse<T>>;
  post<T, D = any>(url: string, data?: D, params?: Record<string, string>): Promise<HttpResponse<T>>;
  // Additional methods as needed
}
```

### Axios Implementation

```typescript
// src/utils/axiosHttpClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { HttpClient, HttpClientOptions, HttpResponse } from './httpClient.js';

export class AxiosHttpClient implements HttpClient {
  private client: AxiosInstance;

  constructor(options: HttpClientOptions = {}) {
    this.client = axios.create({
      baseURL: options.baseUrl,
      timeout: options.timeout || 10000,
      headers: options.headers || {}
    });
  }

  async get<T>(url: string, params?: Record<string, string>): Promise<HttpResponse<T>> {
    try {
      const response = await this.client.get<T>(url, { params });
      return this.transformResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async post<T, D = any>(
    url: string, 
    data?: D, 
    params?: Record<string, string>
  ): Promise<HttpResponse<T>> {
    try {
      const response = await this.client.post<T>(url, data, { params });
      return this.transformResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private transformResponse<T>(response: AxiosResponse<T>): HttpResponse<T> {
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>
    };
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      return new Error(`HTTP Error: ${error.response?.status || 'Unknown'} - ${error.message}`);
    }
    return new Error('Unknown error occurred');
  }
}
```

### Got Implementation (Phase 2)

```typescript
// src/utils/gotHttpClient.ts
import got, { Got, Options, Response } from 'got';
import { HttpClient, HttpClientOptions, HttpResponse } from './httpClient.js';

export class GotHttpClient implements HttpClient {
  private client: Got;

  constructor(options: HttpClientOptions = {}) {
    this.client = got.extend({
      prefixUrl: options.baseUrl || '',
      timeout: { request: options.timeout || 10000 },
      headers: options.headers || {},
      responseType: 'json'
    });
  }

  async get<T>(url: string, params?: Record<string, string>): Promise<HttpResponse<T>> {
    try {
      const response = await this.client.get(url, {
        searchParams: params
      });
      return this.transformResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async post<T, D = any>(
    url: string, 
    data?: D, 
    params?: Record<string, string>
  ): Promise<HttpResponse<T>> {
    try {
      const response = await this.client.post(url, {
        json: data,
        searchParams: params
      });
      return this.transformResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private transformResponse<T>(response: Response<T>): HttpResponse<T> {
    return {
      data: response.body as T,
      status: response.statusCode,
      headers: response.headers as Record<string, string>
    };
  }

  private handleError(error: unknown): Error {
    if (error instanceof got.HTTPError) {
      return new Error(`HTTP Error: ${error.response.statusCode}`);
    }
    if (error instanceof got.TimeoutError) {
      return new Error('Request timed out');
    }
    if (error instanceof got.RequestError) {
      return new Error(`Request failed: ${error.message}`);
    }
    return new Error('Unknown error occurred');
  }
}
```

### TVShowService Refactoring

```typescript
// Updated imports in tvShowService.ts
import { HttpClient } from '../utils/httpClient.js';
import { AxiosHttpClient } from '../utils/axiosHttpClient.js';

// Replace direct axios usage with the HTTP client abstraction
export const api: HttpClient = new AxiosHttpClient({
  baseUrl: TVMAZE_API.BASE_URL
});

// Update fetchTvShows function
export async function fetchTvShows(options: FetchOptions = {}): Promise<Show[]> {
  try {
    const date = options.date !== undefined && options.date !== '' 
      ? options.date 
      : getTodayDate();
    const params = { date, country: 'US' };

    // Fetch shows from both TV and web schedules using the abstraction
    const [tvResponse, webResponse] = await Promise.all([
      api.get<TVMazeShow[]>(TVMAZE_API.TV_SCHEDULE, params),
      api.get<TVMazeShow[]>(TVMAZE_API.WEB_SCHEDULE, { date })
    ]);

    // Normalize and combine show data
    const tvShows = tvResponse.data.map(normalizeShowData).filter(Boolean) as Show[];
    const webShows = webResponse.data.map(normalizeShowData).filter(Boolean) as Show[];
    let shows = [...tvShows, ...webShows];

    // Apply filters if provided
    shows = applyShowFilters(shows, options);

    return shows;
  } catch (_error) {
    throw new Error('Failed to fetch TV shows');
  }
}
```

## Testing Strategy

### HTTP Client Testing

```typescript
// src/tests/utils/httpClient.test.ts
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { AxiosHttpClient } from '../../utils/axiosHttpClient.js';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AxiosHttpClient', () => {
  let client: AxiosHttpClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new AxiosHttpClient({ baseUrl: 'https://api.example.com' });
    
    // Setup axios.create mock
    mockedAxios.create.mockReturnValue(mockedAxios as any);
  });

  it('should make a GET request', async () => {
    const mockResponse = {
      data: { id: 1, name: 'Test' },
      status: 200,
      headers: { 'content-type': 'application/json' }
    };
    
    mockedAxios.get.mockResolvedValueOnce(mockResponse);
    
    const result = await client.get('/test', { param: 'value' });
    
    expect(mockedAxios.get).toHaveBeenCalledWith('/test', { params: { param: 'value' } });
    expect(result).toEqual({
      data: { id: 1, name: 'Test' },
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  });

  // Additional tests for error handling, POST requests, etc.
});
```

### TVShowService Testing

```typescript
// Updated tvShowService.test.ts
import { jest, describe, it } from '@jest/globals';
import { HttpClient, HttpResponse } from '../utils/httpClient.js';

// Create a mock HTTP client for testing
class MockHttpClient implements HttpClient {
  private mockResponses = new Map<string, HttpResponse<any>>();
  private mockErrors = new Map<string, Error>();

  mockGet<T>(url: string, response: HttpResponse<T>): void {
    this.mockResponses.set(url, response);
  }

  mockGetError(url: string, error: Error): void {
    this.mockErrors.set(url, error);
  }

  async get<T>(url: string): Promise<HttpResponse<T>> {
    if (this.mockErrors.has(url)) {
      throw this.mockErrors.get(url)!;
    }
    if (this.mockResponses.has(url)) {
      return this.mockResponses.get(url) as HttpResponse<T>;
    }
    throw new Error(`No mock response for ${url}`);
  }

  // Implement other methods as needed
}

// Use in tests
describe('fetchTvShows', () => {
  let mockClient: MockHttpClient;
  
  beforeEach(() => {
    mockClient = new MockHttpClient();
    // Replace the real client with our mock
    api = mockClient;
  });
  
  it('fetches and combines shows from both TV and web schedules', async () => {
    mockClient.mockGet(`${TVMAZE_API.TV_SCHEDULE}`, {
      data: [mockTvShow],
      status: 200,
      headers: {}
    });
    
    mockClient.mockGet(`${TVMAZE_API.WEB_SCHEDULE}`, {
      data: [mockWebShow],
      status: 200,
      headers: {}
    });

    const shows = await fetchTvShows({ date: mockDate });
    expect(shows).toHaveLength(2);
    expect(shows[0].name).toBe('NCIS');
    expect(shows[1].name).toBe('NCIS: Sydney');
  });
});
```

## Success Criteria

1. **Functional Requirements**:
   - All existing functionality works with the abstraction layer
   - Successful transition from Axios to Got
   - No regressions in existing features

2. **Code Quality Requirements**:
   - Clean abstraction that hides implementation details
   - Type safety throughout the codebase
   - Tests for all new code

3. **Documentation Requirements**:
   - Clear documentation of the HTTP client abstraction
   - Usage examples for future development
   - Migration process documented

## Timeline

- **Phase 1**: 2-3 days
- **Phase 2**: 2-3 days
- **Phase 3**: 1-2 days
- **Total**: 5-8 days
