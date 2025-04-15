/**
 * Tests for fileUtils
 */
import { 
  describe,
  it,
  expect,
  jest
} from '@jest/globals';

// Import the functions to test
import { 
  parseConfigFile,
  handleConfigError
} from '../../utils/fileUtils.js';
import type { AppConfig } from '../../types/configTypes.js';

// We'll test the functions that don't rely on external modules directly
// and leave the other functions for integration tests
describe('fileUtils', () => {
  describe('parseConfigFile', () => {
    it('should parse a JSON config file', () => {
      // Arrange
      const mockContent = '{"country": "US", "types": ["Scripted"]}';
      const expectedConfig: Partial<AppConfig> = {
        country: 'US',
        types: ['Scripted']
      };
      
      // Act
      const result = parseConfigFile(mockContent);
      
      // Assert
      expect(result).toEqual(expectedConfig);
    });
    
    it('should handle empty JSON', () => {
      // Arrange
      const mockContent = '{}';
      
      // Act
      const result = parseConfigFile(mockContent);
      
      // Assert
      expect(result).toEqual({});
    });
    
    it('should handle invalid JSON', () => {
      // Arrange
      const mockContent = '{invalid json}';
      
      // Act & Assert
      expect(() => parseConfigFile(mockContent)).toThrow();
    });
  });
  
  describe('handleConfigError', () => {
    it('should handle Error objects', () => {
      // Arrange
      const mockError = new Error('File not found');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      handleConfigError(mockError);
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Warning: Could not load config.json: File not found'
      );
      
      // Cleanup
      consoleErrorSpy.mockRestore();
    });
    
    it('should handle non-Error objects', () => {
      // Arrange
      const mockError = 'String error message';
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      handleConfigError(mockError);
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Warning: Could not load config.json: String error message'
      );
      
      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });
});
