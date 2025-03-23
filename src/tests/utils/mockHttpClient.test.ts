/**
 * Tests for the MockHttpClient implementation
 */
import { describe, it, expect, beforeEach } from '@jest/globals';

import { MockHttpClient } from './mockHttpClient.js';
import type { HttpResponse } from '../../interfaces/httpClient.js';

describe('MockHttpClient', () => {
  let mockClient: MockHttpClient;

  beforeEach(() => {
    mockClient = new MockHttpClient();
  });

  describe('GET requests', () => {
    it('should return mocked response for specific URL', async () => {
      // Arrange
      const mockResponse: HttpResponse<{ data: string }> = {
        data: { data: 'test data' },
        status: 200,
        headers: {}
      };
      mockClient.mockGet('https://example.com/api', mockResponse);

      // Act
      const result = await mockClient.get<{ data: string }>('https://example.com/api');

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockClient.lastUrl).toBe('https://example.com/api');
    });

    it('should throw mocked error for specific URL', async () => {
      // Arrange
      const mockError = new Error('Network error');
      mockClient.mockGetError('https://example.com/api', mockError);

      // Act & Assert
      await expect(mockClient.get('https://example.com/api'))
        .rejects.toThrow('Network error');
      expect(mockClient.lastUrl).toBe('https://example.com/api');
    });

    it('should return default mock response when URL is not specifically mocked', async () => {
      // Arrange
      const defaultResponse: HttpResponse<{ data: string }> = {
        data: { data: 'default data' },
        status: 200,
        headers: {}
      };
      mockClient.setMockResponse(defaultResponse);

      // Act
      const result = await mockClient.get<{ data: string }>('https://example.com/unknown');

      // Assert
      expect(result).toEqual(defaultResponse);
      expect(mockClient.lastUrl).toBe('https://example.com/unknown');
    });

    it('should throw default mock error when URL is not specifically mocked', async () => {
      // Arrange
      const defaultError = new Error('Default error');
      mockClient.setMockError(defaultError);

      // Act & Assert
      await expect(mockClient.get('https://example.com/unknown'))
        .rejects.toThrow('Default error');
      expect(mockClient.lastUrl).toBe('https://example.com/unknown');
    });

    it('should throw error when no mock is set up', async () => {
      // Act & Assert
      await expect(mockClient.get('https://example.com/api'))
        .rejects.toThrow('No mock response or error set for URL: https://example.com/api');
      expect(mockClient.lastUrl).toBe('https://example.com/api');
    });
  });

  describe('POST requests', () => {
    it('should return mocked response for specific URL', async () => {
      // Arrange
      const mockResponse: HttpResponse<{ result: string }> = {
        data: { result: 'created' },
        status: 201,
        headers: {}
      };
      mockClient.mockPost('https://example.com/api', mockResponse);

      // Act
      const result = await mockClient.post<{ result: string }, { name: string }>(
        'https://example.com/api',
        { name: 'test' }
      );

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockClient.lastUrl).toBe('https://example.com/api');
    });

    it('should throw mocked error for specific URL', async () => {
      // Arrange
      const mockError = new Error('POST error');
      mockClient.mockPostError('https://example.com/api', mockError);

      // Act & Assert
      await expect(mockClient.post('https://example.com/api', { data: 'test' }))
        .rejects.toThrow('POST error');
      expect(mockClient.lastUrl).toBe('https://example.com/api');
    });

    it('should return default mock response when URL is not specifically mocked', async () => {
      // Arrange
      const defaultResponse: HttpResponse<{ result: string }> = {
        data: { result: 'default' },
        status: 200,
        headers: {}
      };
      mockClient.setMockResponse(defaultResponse);

      // Act
      const result = await mockClient.post<{ result: string }>(
        'https://example.com/unknown',
        { data: 'test' }
      );

      // Assert
      expect(result).toEqual(defaultResponse);
      expect(mockClient.lastUrl).toBe('https://example.com/unknown');
    });

    it('should throw default mock error when URL is not specifically mocked', async () => {
      // Arrange
      const defaultError = new Error('Default error');
      mockClient.setMockError(defaultError);

      // Act & Assert
      await expect(mockClient.post('https://example.com/unknown', { data: 'test' }))
        .rejects.toThrow('Default error');
      expect(mockClient.lastUrl).toBe('https://example.com/unknown');
    });

    it('should throw error when no mock is set up', async () => {
      // Act & Assert
      await expect(mockClient.post('https://example.com/api', { data: 'test' }))
        .rejects.toThrow('No mock response or error set for URL: https://example.com/api');
      expect(mockClient.lastUrl).toBe('https://example.com/api');
    });
  });
});
