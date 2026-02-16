/**
 * Tests for the OutputServiceFactory
 */
import { describe, it, expect, jest } from '@jest/globals';
import { createMockOutputService } from './outputServiceFactory.js';
import type { Show } from '../../../schemas/domain.js';

describe('OutputServiceFactory', () => {
  describe('createMockOutputService', () => {
    // Sample test data
    const sampleShow: Show = {
      id: 1,
      name: 'Test Show',
      type: 'scripted',
      language: 'English',
      genres: ['Drama'],
      network: 'Test Network',
      summary: '<p>Test summary</p>',
      airtime: '20:00',
      season: 1,
      number: 1
    };
    
    it('should create a mock output service with default implementation', async () => {
      // Act
      const service = createMockOutputService();
      
      // Assert
      expect(service).toBeDefined();
      expect(typeof service.renderOutput).toBe('function');
      
      // Default implementation should resolve without error
      await expect(service.renderOutput([sampleShow])).resolves.toBeUndefined();
      expect(service.renderOutput).toHaveBeenCalledWith([sampleShow]);
    });
    
    it('should throw an error when renderError is provided', async () => {
      // Arrange
      const error = new Error('Test render error');
      const service = createMockOutputService({ renderError: error });
      
      // Act & Assert
      await expect(service.renderOutput([sampleShow])).rejects.toThrow(error);
      expect(service.renderOutput).toHaveBeenCalledWith([sampleShow]);
    });
    
    it('should execute onRenderOutput callback when provided', async () => {
      // Arrange
      const onRenderOutput = jest.fn<(shows: Show[]) => void>();
      const service = createMockOutputService({ onRenderOutput });
      
      // Act
      await service.renderOutput([sampleShow]);
      
      // Assert
      expect(onRenderOutput).toHaveBeenCalledWith([sampleShow]);
      expect(service.renderOutput).toHaveBeenCalledWith([sampleShow]);
    });
    
    it('should apply custom implementation', async () => {
      // Arrange
      const customRenderOutput = jest.fn().mockResolvedValue(undefined);
      
      // Act
      const service = createMockOutputService({
        implementation: {
          // Use the jest mock function directly
          renderOutput: customRenderOutput
        }
      });
      
      // Act
      await service.renderOutput([sampleShow]);
      
      // Assert
      expect(customRenderOutput).toHaveBeenCalledWith([sampleShow]);
    });
  });
});
