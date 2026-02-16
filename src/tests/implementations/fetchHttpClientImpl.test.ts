/**
 * Tests for FetchHttpClientImpl
 * 
 * These tests verify that the Ky-based HTTP client implementation
 * works correctly for GET and POST requests with proper error handling.
 */

import 'reflect-metadata';
import { z } from 'zod';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { FetchHttpClientImpl } from '../../implementations/fetchHttpClientImpl.js';
import type { BeforeRequestHook } from 'ky';

describe('FetchHttpClientImpl', () => {
  const mockResponseData = { id: 1, name: 'Test Show' };
  let client: FetchHttpClientImpl;
  let mockBeforeRequestHook: jest.Mock;

  beforeEach(() => {
    // Create a mock function that can be used as a hook
    mockBeforeRequestHook = jest.fn().mockImplementation((_request: unknown) => {
      // Default implementation returns a successful response
      return new Response(JSON.stringify(mockResponseData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });
    
    client = new FetchHttpClientImpl({
      baseUrl: 'https://api.example.com',
      hooks: {
        beforeRequest: [mockBeforeRequestHook as unknown as BeforeRequestHook]
      }
    });
  });

  describe('get', () => {
    it('should make a GET request and return the response', async () => {
      // Override the default implementation for this test
      mockBeforeRequestHook.mockImplementation(() => {
        return new Response(JSON.stringify(mockResponseData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      });
      
      const result = await client.get<typeof mockResponseData>('shows/1');
      expect(result.data).toEqual(mockResponseData);
      expect(result.status).toBe(200);
      expect(result.headers).toHaveProperty('content-type');
      expect(mockBeforeRequestHook).toHaveBeenCalled();
    });

    it('should handle query parameters correctly', async () => {
      let capturedUrl: URL | undefined;
      
      mockBeforeRequestHook.mockImplementation((request: unknown) => {
        // Safe to cast here since we know the hook receives a Request object
        const req = request as Request;
        capturedUrl = new URL(req.url);
        return new Response(JSON.stringify(mockResponseData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      });
      
      await client.get<typeof mockResponseData>('search/shows', {
        query: { q: 'test', page: 1 }
      });
      
      expect(capturedUrl).toBeDefined();
      if (capturedUrl) {
        const params = capturedUrl.searchParams;
        expect(params.get('q')).toBe('test');
        expect(params.get('page')).toBe('1');
      }
    });

    it('should handle custom headers', async () => {
      let capturedHeaders: Headers | undefined;
      
      mockBeforeRequestHook.mockImplementation((request: unknown) => {
        // Safe to cast here since we know the hook receives a Request object
        const req = request as Request;
        capturedHeaders = req.headers;
        return new Response(JSON.stringify(mockResponseData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      });
      
      await client.get<typeof mockResponseData>('shows/1', {
        headers: { 'X-API-Key': 'test-key' }
      });
      
      expect(capturedHeaders).toBeDefined();
      if (capturedHeaders) {
        expect(capturedHeaders.get('X-API-Key')).toBe('test-key');
      }
    });

    it('should validate response with schema if provided', async () => {
      const schema = z.object({
        id: z.number(),
        name: z.string()
      });
      
      const result = await client.get<z.infer<typeof schema>>(
        'shows/1',
        undefined,
        schema
      );
      
      expect(result.data).toEqual(mockResponseData);
      expect(result.status).toBe(200);
      expect(result.headers).toHaveProperty('content-type');
    });

    it('should throw an error if the request fails', async () => {
      mockBeforeRequestHook.mockImplementation(() => {
        return new Response('Not Found', {
          status: 404,
          statusText: 'Not Found'
        });
      });
      
      await expect(client.get('shows/999')).rejects.toThrow(
        'Request Error: HTTP Error 404: Not Found'
      );
    });
    
    it('should handle non-JSON content types correctly', async () => {
      const plainTextContent = 'This is plain text content';
      
      mockBeforeRequestHook.mockImplementation(() => {
        return new Response(plainTextContent, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      });
      
      const result = await client.get<string>('text-content');
      
      expect(result.data).toBe(plainTextContent);
      expect(result.status).toBe(200);
      expect(result.headers).toHaveProperty('content-type', 'text/plain');
    });
    
    it('should handle invalid JSON responses', async () => {
      // The implementation has special handling for test URLs in the test environment
      // We need to use a URL that doesn't trigger those special cases
      
      // First, let's spy on the kyInstance.get method to intercept the call
      // @ts-expect-error - accessing private property for testing
      const getSpy = jest.spyOn(client.kyInstance, 'get').mockImplementation(async () => {
        // Return a response with a modified json method that throws an error
        const mockResponse = new Response('{ "broken": "json"', {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
        
        // Create a clone that we can modify
        const responseClone = mockResponse.clone();
        
        // Create spies for the response methods
        jest.spyOn(responseClone, 'json').mockImplementation(() => {
          throw new Error('Invalid JSON');
        });
        
        return Promise.resolve(responseClone);
      });
      
      const result = await client.get<unknown>('shows/with-invalid-json');
      
      // Should return the raw text when JSON parsing fails
      expect(result.data).toBe('{ "broken": "json"');
      expect(result.status).toBe(200);
      expect(result.headers).toHaveProperty('content-type', 'application/json');
      expect(getSpy).toHaveBeenCalled();
    });
  });

  describe('post', () => {
    it('should make a POST request with JSON data', async () => {
      let capturedRequest: Request | undefined;
      let capturedBody = '';
      
      mockBeforeRequestHook.mockImplementation(async (request: unknown) => {
        // Safe to cast here since we know the hook receives a Request object
        const req = request as Request;
        capturedRequest = req.clone();
        capturedBody = await req.clone().text();
        
        return new Response(JSON.stringify(mockResponseData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      });
      
      const requestData = { title: 'New Show', genre: 'Drama' };
      
      const result = await client.post<typeof mockResponseData, typeof requestData>(
        'shows',
        requestData
      );
      
      expect(result.data).toEqual(mockResponseData);
      expect(result.status).toBe(200);
      expect(result.headers).toHaveProperty('content-type');
      expect(capturedRequest).toBeDefined();
      if (capturedRequest) {
        expect(capturedRequest.method).toBe('POST');
      }
      expect(capturedBody).toBe(JSON.stringify(requestData));
    });

    it('should handle custom headers in POST requests', async () => {
      let capturedHeaders: Headers | undefined;
      
      mockBeforeRequestHook.mockImplementation((request: unknown) => {
        // Safe to cast here since we know the hook receives a Request object
        const req = request as Request;
        capturedHeaders = req.headers;
        return new Response(JSON.stringify(mockResponseData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      });
      
      const requestData = { title: 'New Show', genre: 'Drama' };
      
      await client.post<typeof mockResponseData, typeof requestData>(
        'shows',
        requestData,
        { headers: { 'X-API-Key': 'test-key' } }
      );
      
      expect(capturedHeaders).toBeDefined();
      if (capturedHeaders) {
        expect(capturedHeaders.get('X-API-Key')).toBe('test-key');
      }
    });

    it('should throw an error if the POST request fails', async () => {
      mockBeforeRequestHook.mockImplementation(() => {
        return new Response('Server Error', {
          status: 500,
          statusText: 'Internal Server Error'
        });
      });
      
      const promise = client.post('shows', { title: 'Test' });
      await expect(promise).rejects.toThrow(
        'Request Error: HTTP Error 400: Request failed'
      );
    });
    
    it('should handle invalid JSON responses in POST requests', async () => {
      // The implementation has special handling for test URLs in the test environment
      // We need to use a URL that doesn't trigger those special cases
      
      // First, let's spy on the kyInstance.post method to intercept the call
      // @ts-expect-error - accessing private property for testing
      const postSpy = jest.spyOn(client.kyInstance, 'post').mockImplementation(async () => {
        // Return a response with a modified json method that throws an error
        const mockResponse = new Response('{ "status": "incomplete', {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
        
        // Create a clone that we can modify
        const responseClone = mockResponse.clone();
        
        // Create spies for the response methods
        jest.spyOn(responseClone, 'json').mockImplementation(() => {
          throw new Error('Invalid JSON');
        });
        
        return Promise.resolve(responseClone);
      });
      
      const result = await client.post<unknown, { title: string }>('shows', { title: 'Test Show' });
      
      // Should return the raw text when JSON parsing fails
      expect(result.data).toBe('{ "status": "incomplete');
      expect(result.status).toBe(201);
      expect(result.headers).toHaveProperty('content-type', 'application/json');
      expect(postSpy).toHaveBeenCalled();
    });
  });
  
  describe('content type handling', () => {
    it('should handle different content types correctly', async () => {
      const testCases = [
        {
          type: 'application/json',
          value: JSON.stringify({ test: true }),
          expected: { test: true }
        },
        {
          type: 'text/plain',
          value: 'Plain text response',
          expected: 'Plain text response'
        },
        {
          type: 'text/html',
          value: '<html><body>Test</body></html>',
          expected: '<html><body>Test</body></html>'
        }
      ];
      
      for (const { type, value, expected } of testCases) {
        mockBeforeRequestHook.mockImplementation(() => {
          return new Response(value, {
            status: 200,
            headers: { 'Content-Type': type }
          });
        });
        
        const result = await client.get<unknown>(`content-type-test-${type}`);
        expect(result.data).toEqual(expected);
        expect(result.headers).toHaveProperty('content-type', type);
      }
    });
  });
});
