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
  });
});
