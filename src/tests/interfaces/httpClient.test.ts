import { afterEach, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import nock from 'nock';

import { FetchHttpClientImpl } from '../../implementations/fetchHttpClientImpl.js';
import type { HttpClientOptions, HttpClient } from '../../interfaces/httpClient.js';

// Base URL for tests
const BASE_URL = 'https://api.example.com';

/**
 * Tests for the HttpClient interface
 * 
 * These tests verify that any implementation of the HttpClient interface
 * behaves according to the interface contract. We use the FetchHttpClientImpl
 * as a concrete implementation for testing, but the tests focus on the
 * behavior defined by the interface rather than implementation details.
 */
describe('HttpClient Interface', () => {
  let client: HttpClient;
  
  beforeEach(() => {
    // Create a new client instance before each test
    client = new FetchHttpClientImpl({ baseUrl: BASE_URL } as HttpClientOptions);
    
    // Disable real network connections
    nock.disableNetConnect();
  });
  
  afterEach(() => {
    // Clean up all interceptors
    nock.cleanAll();
    
    // Allow real HTTP requests after tests
    nock.enableNetConnect();
  });

  afterAll(() => {
    nock.restore();
    nock.cleanAll();
    nock.enableNetConnect();
  });

  describe('get', () => {
    it('should make a GET request and transform the response', async () => {
      // Setup mock response with Nock
      const mockResponseData = { id: 1, name: 'Test' };
      
      // Setup the Nock interceptor
      nock(BASE_URL)
        .get('/test')
        .query({ param: 'value' })
        .reply(200, mockResponseData, { 'content-type': 'application/json' });
      
      // Execute the method
      const result = await client.get<Record<string, unknown>>('/test', { param: 'value' });
      
      // Verify the result
      expect(result).toEqual({
        data: mockResponseData,
        status: 200,
        headers: expect.objectContaining({ 'content-type': 'application/json' })
      });
    });

    it('should handle non-JSON responses', async () => {
      // Setup mock response with Nock
      const plainTextResponse = 'Plain text response';
      
      // Setup the Nock interceptor
      nock(BASE_URL)
        .get('/test')
        .reply(200, plainTextResponse, { 'content-type': 'text/plain' });
      
      // Execute the method
      const result = await client.get<string>('/test');
      
      // Verify the result
      expect(result).toEqual({
        data: plainTextResponse,
        status: 200,
        headers: expect.objectContaining({ 'content-type': 'text/plain' })
      });
    });

    it('should handle HTTP errors', async () => {
      // Setup mock error response with Nock
      nock(BASE_URL)
        .get('/test')
        .reply(404, 'Not Found');
      
      // Verify the error is thrown correctly
      await expect(client.get<unknown>('/test')).rejects.toThrow(
        'Request failed with status code 404'
      );
    });

    it('should handle invalid JSON responses', async () => {
      // Setup mock response with Nock - invalid JSON
      const invalidJson = '{ "broken": "json"';
      
      // Setup the Nock interceptor
      nock(BASE_URL)
        .get('/test')
        .reply(200, invalidJson, { 'content-type': 'application/json' });
      
      // Verify the error is thrown correctly
      await expect(client.get<unknown>('/test')).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      // Setup mock network error with Nock
      nock(BASE_URL)
        .get('/test')
        .replyWithError('Network error');
      
      // Verify the error is thrown correctly
      await expect(client.get<unknown>('/test')).rejects.toThrow();
    });
  });

  describe('post', () => {
    it('should make a POST request and transform the response', async () => {
      // Setup mock response with Nock
      const requestBody = { name: 'New Item' };
      const mockResponseData = { success: true };
      
      // Setup the Nock interceptor
      nock(BASE_URL)
        .post('/create', requestBody)
        .query({ token: 'abc123' })
        .reply(201, mockResponseData, { 'content-type': 'application/json' });
      
      // Execute the method
      const result = await client.post<Record<string, unknown>, Record<string, unknown>>(
        '/create', 
        requestBody, 
        { token: 'abc123' }
      );
      
      // Verify the result
      expect(result).toEqual({
        data: mockResponseData,
        status: 201,
        headers: expect.objectContaining({ 'content-type': 'application/json' })
      });
    });

    it('should handle post request errors', async () => {
      // Setup mock error response with Nock
      const requestBody = { invalid: true };
      
      nock(BASE_URL)
        .post('/create', requestBody)
        .reply(400, 'Bad Request');
      
      // Verify the error is thrown correctly
      await expect(client.post<unknown, Record<string, unknown>>('/create', requestBody))
        .rejects.toThrow(
          'Request failed with status code 400'
        );
    });

    it('should handle post request with invalid JSON response', async () => {
      // Setup mock response with Nock - invalid JSON
      const requestBody = { test: true };
      const invalidJson = '{ "broken": "json"';
      
      // Setup the Nock interceptor
      nock(BASE_URL)
        .post('/create', requestBody)
        .reply(200, invalidJson, { 'content-type': 'application/json' });
      
      // Execute the method
      const result = await client.post<unknown, Record<string, unknown>>('/create', requestBody);
      
      // Verify the result - should return the raw body
      expect(result).toEqual({
        data: invalidJson,
        status: 200,
        headers: expect.objectContaining({ 'content-type': 'application/json' })
      });
    });
  });
});
