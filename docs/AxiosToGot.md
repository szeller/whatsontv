# Axios to Got Migration Guide

## Overview

This document outlines the migration process from Axios to Got as the HTTP client for the WhatsOnTV application. The migration follows the project's established code quality standards while improving type safety and testability.

## Migration Strategy

The migration was implemented using the following phased approach:

### Phase 1: HTTP Client Abstraction with Axios
1. Created an abstraction layer with the `HttpClient` interface
2. Implemented the interface with `AxiosHttpClient` 
3. Updated the application to use the new abstraction
4. Updated tests to work with the abstraction layer

### Phase 2: Got Implementation
1. Implemented the `GotHttpClient` class
2. Switched the implementation from Axios to Got
3. Addressed Got-specific behaviors (URL handling, response parsing)
4. Verified functionality with tests

### Phase 3: Cleanup and Documentation
1. Removed Axios dependencies
2. Documented the migration process
3. Performed final code quality review

## Implementation Details

### HTTP Client Interface

The `HttpClient` interface provides a consistent API for making HTTP requests, regardless of the underlying implementation:

```typescript
export interface HttpClient {
  get<T>(url: string, params?: Record<string, string>): Promise<HttpResponse<T>>;
  post<T, D = unknown>(
    url: string, 
    data?: D, 
    params?: Record<string, string>
  ): Promise<HttpResponse<T>>;
}
```

### Got Implementation

The `GotHttpClient` implementation uses Got v14.4.6 and handles:

- URL normalization (removing leading slashes when using `prefixUrl`)
- Response transformation from Got's format to our standard format
- Error handling with consistent error messages
- Content type detection for proper JSON parsing

### Key Differences Between Axios and Got

1. **URL Handling**:
   - Axios: Automatically joins base URL and path
   - Got: Requires paths without leading slashes when using `prefixUrl`

2. **Response Structure**:
   - Axios: Response data is in `response.data`
   - Got: Response data is in `response.body`

3. **Error Handling**:
   - Axios: Throws errors for non-2xx responses by default
   - Got: Can be configured with `throwHttpErrors: false` to handle all responses

4. **Response Type**:
   - Axios: Automatically parses JSON responses
   - Got: Configurable with `responseType` option

## Code Style Adherence

The implementation adheres to the project's established code style:

- Single quotes for strings
- Semicolons required
- 2-space indentation
- 100 character line width
- No trailing commas

## TypeScript Requirements

The implementation follows strict TypeScript requirements:

- Explicit function return types
- No implicit any types
- Proper type definitions for all parameters and return values
- Compatible with TypeScript version >=4.7.4 <5.6.0

## Testing

Tests for the `GotHttpClient` implementation follow the AAA pattern (Arrange-Act-Assert) and include:

- Successful GET and POST requests
- Error handling for HTTP errors
- Error handling for network errors
- Handling of non-JSON responses

## Error Handling

The implementation includes robust error handling:

- Typed errors with consistent format
- Proper error context for debugging
- Distinction between HTTP errors, network errors, and other errors

## Logging

The implementation includes logging for:

- Request URLs
- Error details
- Response transformation issues

## Mock Implementation for Testing

A `MockHttpClient` implementation was created to facilitate testing:

```typescript
export class MockHttpClient implements HttpClient {
  private mockResponses = new Map<string, HttpResponse<any>>();
  private mockErrors = new Map<string, Error>();

  mockGet<T>(url: string, response: HttpResponse<T>): void {
    this.mockResponses.set(`GET:${url}`, response);
  }

  mockGetError(url: string, error: Error): void {
    this.mockErrors.set(`GET:${url}`, error);
  }

  mockPost<T>(url: string, response: HttpResponse<T>): void {
    this.mockResponses.set(`POST:${url}`, response);
  }

  mockPostError(url: string, error: Error): void {
    this.mockErrors.set(`POST:${url}`, error);
  }

  async get<T>(url: string, params?: Record<string, string>): Promise<HttpResponse<T>> {
    const key = `GET:${url}`;
    if (this.mockErrors.has(key)) {
      throw this.mockErrors.get(key)!;
    }
    if (this.mockResponses.has(key)) {
      return this.mockResponses.get(key) as HttpResponse<T>;
    }
    throw new Error(`No mock response for GET ${url}`);
  }

  async post<T, D = unknown>(
    url: string,
    data?: D,
    params?: Record<string, string>
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
```

## Conclusion

The migration from Axios to Got has been successfully completed, with the application now using the Got HTTP client through the abstraction layer. The implementation maintains compatibility with the existing codebase while providing improved type safety and testability.
