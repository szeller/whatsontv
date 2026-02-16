/**
 * Tests for fileUtils
 */
import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach
} from '@jest/globals';

// Import the functions to test
import {
  parseConfigFile,
  handleConfigError,
  getConfigFilePath
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
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { /* noop */ });
      
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
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { /* noop */ });
      
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

  describe('getConfigFilePath', () => {
    const originalEnv = process.env.CONFIG_FILE;

    beforeEach(() => {
      // Clear CONFIG_FILE before each test
      delete process.env.CONFIG_FILE;
    });

    afterEach(() => {
      // Restore original value
      if (originalEnv !== undefined) {
        process.env.CONFIG_FILE = originalEnv;
      } else {
        delete process.env.CONFIG_FILE;
      }
    });

    it('should return CONFIG_FILE env var when set', () => {
      // Arrange
      const expectedPath = '/var/task/config.lambda.json';
      process.env.CONFIG_FILE = expectedPath;

      // Act
      const result = getConfigFilePath('file:///some/path/module.js');

      // Assert
      expect(result).toBe(expectedPath);
    });

    it('should return CONFIG_FILE even when configFileName param is provided', () => {
      // Arrange
      const expectedPath = '/custom/config/path.json';
      process.env.CONFIG_FILE = expectedPath;

      // Act
      const result = getConfigFilePath('file:///some/path/module.js', 'other-config.json');

      // Assert
      expect(result).toBe(expectedPath);
    });

    it('should ignore empty CONFIG_FILE env var', () => {
      // Arrange
      process.env.CONFIG_FILE = '';

      // Act
      const result = getConfigFilePath('file:///some/path/to/src/utils/module.js');

      // Assert
      expect(result).toContain('config.json');
      expect(result).not.toBe('');
    });

    it('should ignore whitespace-only CONFIG_FILE env var', () => {
      // Arrange
      process.env.CONFIG_FILE = '   ';

      // Act
      const result = getConfigFilePath('file:///some/path/to/src/utils/module.js');

      // Assert
      expect(result).toContain('config.json');
      expect(result).not.toBe('   ');
    });

    it('should use configFileName parameter when CONFIG_FILE not set', () => {
      // Arrange - CONFIG_FILE is not set (cleared in beforeEach)

      // Act
      const result = getConfigFilePath(
        'file:///some/path/to/src/utils/module.js',
        'custom-config.json'
      );

      // Assert
      expect(result).toContain('custom-config.json');
    });

    it('should default to config.json when no configFileName provided', () => {
      // Arrange - CONFIG_FILE is not set (cleared in beforeEach)

      // Act
      const result = getConfigFilePath('file:///some/path/to/src/utils/module.js');

      // Assert
      expect(result).toContain('config.json');
    });
  });
});
