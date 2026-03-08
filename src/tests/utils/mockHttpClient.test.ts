/**
 * Tests for the MockHttpClient implementation
 */
import { describe, it, expect, beforeEach } from '@jest/globals';

import { MockHttpClient } from '../testutils/mockHttpClient.js';
import type { HttpResponse } from '../../interfaces/httpClient.js';

const API_URL = 'https://example.com/api';
const UNKNOWN_URL = 'https://example.com/unknown';
const DEFAULT_ERROR_MESSAGE = 'Default error';

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
      mockClient.mockGet(API_URL, mockResponse);

      // Act
      const result = await mockClient.get<{ data: string }>(API_URL);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockClient.lastUrl).toBe(API_URL);
    });

    it('should throw mocked error for specific URL', async () => {
      // Arrange
      const mockError = new Error('Network error');
      mockClient.mockGetError(API_URL, mockError);

      // Act & Assert
      await expect(mockClient.get(API_URL))
        .rejects.toThrow('Network error');
      expect(mockClient.lastUrl).toBe(API_URL);
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
      const result = await mockClient.get<{ data: string }>(UNKNOWN_URL);

      // Assert
      expect(result).toEqual(defaultResponse);
      expect(mockClient.lastUrl).toBe(UNKNOWN_URL);
    });

    it('should throw default mock error when URL is not specifically mocked', async () => {
      // Arrange
      const defaultError = new Error(DEFAULT_ERROR_MESSAGE);
      mockClient.setMockError(defaultError);

      // Act & Assert
      await expect(mockClient.get(UNKNOWN_URL))
        .rejects.toThrow(DEFAULT_ERROR_MESSAGE);
      expect(mockClient.lastUrl).toBe(UNKNOWN_URL);
    });

    it('should throw error when no mock is set up', async () => {
      // Act & Assert
      await expect(mockClient.get(API_URL))
        .rejects.toThrow(`No mock response or error set for URL: ${API_URL}`);
      expect(mockClient.lastUrl).toBe(API_URL);
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
      mockClient.mockPost(API_URL, mockResponse);

      // Act
      const result = await mockClient.post<{ result: string }, { name: string }>(
        API_URL,
        { name: 'test' }
      );

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockClient.lastUrl).toBe(API_URL);
    });

    it('should throw mocked error for specific URL', async () => {
      // Arrange
      const mockError = new Error('POST error');
      mockClient.mockPostError(API_URL, mockError);

      // Act & Assert
      await expect(mockClient.post(API_URL, { data: 'test' }))
        .rejects.toThrow('POST error');
      expect(mockClient.lastUrl).toBe(API_URL);
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
        UNKNOWN_URL,
        { data: 'test' }
      );

      // Assert
      expect(result).toEqual(defaultResponse);
      expect(mockClient.lastUrl).toBe(UNKNOWN_URL);
    });

    it('should throw default mock error when URL is not specifically mocked', async () => {
      // Arrange
      const defaultError = new Error(DEFAULT_ERROR_MESSAGE);
      mockClient.setMockError(defaultError);

      // Act & Assert
      await expect(mockClient.post(UNKNOWN_URL, { data: 'test' }))
        .rejects.toThrow(DEFAULT_ERROR_MESSAGE);
      expect(mockClient.lastUrl).toBe(UNKNOWN_URL);
    });

    it('should throw error when no mock is set up', async () => {
      // Act & Assert
      await expect(mockClient.post(API_URL, { data: 'test' }))
        .rejects.toThrow(`No mock response or error set for URL: ${API_URL}`);
      expect(mockClient.lastUrl).toBe(API_URL);
    });
  });
});
