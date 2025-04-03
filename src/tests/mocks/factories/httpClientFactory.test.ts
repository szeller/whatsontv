/**
 * Tests for the HttpClientFactory
 */
import { describe, it, expect } from '@jest/globals';
import { createMockHttpClient } from './httpClientFactory.js';
import type { HttpResponse } from '../../../interfaces/httpClient.js';

describe('HttpClientFactory', () => {
  describe('createMockHttpClient', () => {
    it('should create a mock HTTP client with default settings', () => {
      // Act
      const client = createMockHttpClient();
      
      // Assert
      expect(client).toBeDefined();
      expect(client.get).toBeInstanceOf(Function);
      expect(client.post).toBeInstanceOf(Function);
    });
    
    it('should set up default response', async () => {
      // Arrange
      const defaultResponse: HttpResponse<{ data: string }> = {
        data: { data: 'default data' },
        status: 200,
        headers: {}
      };
      
      // Act
      const client = createMockHttpClient({
        defaultResponse
      });
      
      // Assert
      const result = await client.get<{ data: string }>('https://example.com/any');
      expect(result).toEqual(defaultResponse);
    });
    
    it('should set up specific GET responses', async () => {
      // Arrange
      const specificResponse: HttpResponse<{ data: string }> = {
        data: { data: 'specific data' },
        status: 200,
        headers: {}
      };
      
      // Act
      const client = createMockHttpClient({
        getResponses: {
          'https://example.com/api': specificResponse
        }
      });
      
      // Assert
      const result = await client.get<{ data: string }>('https://example.com/api');
      expect(result).toEqual(specificResponse);
    });
    
    it('should set up specific GET errors', async () => {
      // Arrange
      const specificError = new Error('Specific error');
      
      // Act
      const client = createMockHttpClient({
        getErrors: {
          'https://example.com/api': specificError
        }
      });
      
      // Assert
      await expect(client.get('https://example.com/api'))
        .rejects.toThrow('Specific error');
    });
    
    it('should set up specific POST responses', async () => {
      // Arrange
      const specificResponse: HttpResponse<{ result: string }> = {
        data: { result: 'created' },
        status: 201,
        headers: {}
      };
      
      // Act
      const client = createMockHttpClient({
        postResponses: {
          'https://example.com/api': specificResponse
        }
      });
      
      // Assert
      const result = await client.post<{ result: string }>(
        'https://example.com/api',
        { name: 'test' }
      );
      expect(result).toEqual(specificResponse);
    });
    
    it('should set up specific POST errors', async () => {
      // Arrange
      const specificError = new Error('POST error');
      
      // Act
      const client = createMockHttpClient({
        postErrors: {
          'https://example.com/api': specificError
        }
      });
      
      // Assert
      await expect(client.post('https://example.com/api', { data: 'test' }))
        .rejects.toThrow('POST error');
    });
  });
});
