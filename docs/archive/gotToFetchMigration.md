# Got to Fetch Migration

## Overview

This document details the migration from Got to Fetch (via Ky) as the standard HTTP client for the WhatsOnTV application. This migration completes our transition to a more modern, ESM-compatible HTTP client implementation.

## Motivation

The decision to standardize on the Fetch API implementation was driven by several factors:

1. **ESM Compatibility**: Better support for ES modules, which is the direction of modern JavaScript
2. **Reduced Dependencies**: Fewer external dependencies to maintain and update
3. **Modern API**: Using the web standard Fetch API for better long-term compatibility
4. **Simplified Codebase**: Maintaining a single HTTP client implementation reduces complexity
5. **Improved Testing**: Easier to mock and test with a single implementation

## Migration Process

### Phase 1: Implementation of FetchHttpClientImpl

The `FetchHttpClientImpl` was implemented using Ky, a wrapper around the Fetch API that provides a more convenient interface while maintaining the core Fetch API principles.

Key features of the implementation:

- Full compliance with the `HttpClient` interface
- Support for Zod schema validation
- Proper content type detection and handling
- Comprehensive error handling

### Phase 2: Testing and Validation

Extensive tests were added to ensure the `FetchHttpClientImpl` correctly handles:

- Successful GET and POST requests
- Error handling for HTTP errors
- Error handling for network errors
- Invalid JSON responses
- Different content types (JSON, text, HTML)
- Schema validation

### Phase 3: Removal of Got

After validating that the `FetchHttpClientImpl` was working correctly, the Got implementation was removed:

1. Removed `GotHttpClientImpl` class
2. Removed Got-related test files
3. Removed Got dependency from package.json
4. Updated documentation to reflect the change

## Implementation Details

### FetchHttpClientImpl

The `FetchHttpClientImpl` uses Ky to provide a modern, Promise-based HTTP client:

```typescript
export class FetchHttpClientImpl implements HttpClient {
  private readonly kyInstance: typeof ky;

  constructor(options: FetchHttpClientOptions) {
    this.kyInstance = ky.create({
      timeout: options.timeout || 30000,
      retry: options.retry || 0,
      prefixUrl: options.baseUrl || '',
      headers: options.headers || {}
    });
  }

  async get<T>(
    url: string, 
    options?: HttpRequestOptions,
    schema?: ZodType<T>
  ): Promise<HttpResponse<T>> {
    // Implementation details...
  }

  async post<T, D = unknown>(
    url: string, 
    data?: D, 
    options?: HttpRequestOptions,
    schema?: ZodType<T>
  ): Promise<HttpResponse<T>> {
    // Implementation details...
  }
}
```

### Key Differences Between Got and Fetch/Ky

1. **Response Handling**:
   - Got: Uses `response.body` for parsed data
   - Fetch/Ky: Uses methods like `response.json()` or `response.text()`

2. **Error Handling**:
   - Got: Can be configured with `throwHttpErrors`
   - Fetch/Ky: Throws for network errors but not HTTP errors by default

3. **Request Configuration**:
   - Got: Uses a configuration object with specific properties
   - Fetch/Ky: Uses a more standardized Request object

## Benefits Realized

1. **Simplified Dependency Management**: Removed one external dependency
2. **Improved ESM Compatibility**: Better alignment with modern JavaScript practices
3. **Enhanced Testing**: More comprehensive test coverage for edge cases
4. **Streamlined Codebase**: Single HTTP client implementation to maintain
5. **Better Error Handling**: Improved handling of invalid JSON responses

## Future Considerations

As the Fetch API continues to evolve and gain more features, our implementation can be updated to take advantage of these improvements without changing the interface.

Potential future enhancements include:

1. **Streaming Support**: Leveraging Fetch's streaming capabilities for large responses
2. **AbortController Integration**: Better support for request cancellation
3. **Service Worker Integration**: Potential for offline support and caching

## Conclusion

The migration from Got to Fetch (via Ky) represents a step forward in modernizing the WhatsOnTV application's HTTP client implementation. By standardizing on the Fetch API, we've simplified our codebase, reduced dependencies, and improved compatibility with modern JavaScript practices.
