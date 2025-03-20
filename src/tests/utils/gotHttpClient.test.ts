import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import nock from 'nock';

import { GotHttpClient } from '../../utils/gotHttpClient.js';

// Base URL for tests
const BASE_URL = 'https://api.example.com';

describe('GotHttpClient', () => {
  let client: GotHttpClient;
  
  beforeEach(() => {
    // Create a new client instance before each test
    client = new GotHttpClient({ baseUrl: BASE_URL });
    
    // Enable Nock for real HTTP requests
    nock.disableNetConnect();
  });
  
  afterEach(() => {
    // Clean up all interceptors
    nock.cleanAll();
    
    // Allow real HTTP requests after tests
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
      await expect(client.get<unknown>('/test')).rejects.toThrow('HTTP Error: 404');
    });

    it('should handle network errors', async () => {
      // For network errors, we need to use a different approach
      // since Nock's replyWithError has some issues with Got
      
      // Clean up nock to allow for a real request that will fail
      nock.cleanAll();
      nock.enableNetConnect();
      
      // Create a client with a non-existent domain to force a network error
      const badClient = new GotHttpClient({ 
        baseUrl: 'https://non-existent-domain-that-will-fail.example'
      });
      
      // Set a shorter timeout to make the test faster
      jest.setTimeout(10000);
      
      // Verify the error is thrown correctly
      await expect(badClient.get<unknown>('/test')).rejects.toThrow('Network Error:');
      
      // Reset the timeout
      jest.setTimeout(5000);
      
      // Re-disable network connections for other tests
      nock.disableNetConnect();
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
        .rejects.toThrow('HTTP Error: 400');
    });
  });
});
