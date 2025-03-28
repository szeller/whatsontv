/**
 * Tests for the console output implementation
 */
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createMockConsole } from '../../testutils/consoleTestHelpers.js';
import { ConsoleOutputImpl } from '../../../implementations/console/consoleOutputImpl.js';

describe('ConsoleOutputImpl', () => {
  const originalConsole = {
    log: console.log,
    error: console.error
  };

  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
  });

  describe('consoleOutput', () => {
    it('should log messages correctly', () => {
      // Arrange
      const message = 'test message';
      const consoleOutput = new ConsoleOutputImpl();

      // Act
      consoleOutput.log(message);

      // Assert
      expect(console.log).toHaveBeenCalledWith(message);
    });

    it('should handle undefined log messages', () => {
      // Arrange
      const consoleOutput = new ConsoleOutputImpl();

      // Act
      consoleOutput.log(undefined);

      // Assert
      expect(console.log).toHaveBeenCalledWith(undefined);
    });

    it('should log errors correctly', () => {
      // Arrange
      const message = 'error message';
      const args = ['arg1', 'arg2'];
      const consoleOutput = new ConsoleOutputImpl();

      // Act
      consoleOutput.error(message, ...args);

      // Assert
      expect(console.error).toHaveBeenCalledWith(message, ...args);
    });
    
    it('should log with level "log" correctly', () => {
      // Arrange
      const message = 'log level message';
      const consoleOutput = new ConsoleOutputImpl();

      // Act
      consoleOutput.logWithLevel('log', message);

      // Assert
      expect(console.log).toHaveBeenCalledWith(message);
    });

    it('should log with level "error" correctly', () => {
      // Arrange
      const message = 'error level message';
      const args = ['detail1', 'detail2'];
      const consoleOutput = new ConsoleOutputImpl();

      // Act
      consoleOutput.logWithLevel('error', message, ...args);

      // Assert
      expect(console.error).toHaveBeenCalledWith(message, ...args);
    });
  });

  describe('createMockConsole', () => {
    it('should capture log messages', () => {
      // Arrange
      const mockConsole = createMockConsole();
      const message = 'test message';
      
      // Act
      mockConsole.log(message);
      
      // Assert
      const output = mockConsole.getOutput();
      expect(output).toContain(message);
    });
    
    it('should capture multiple log messages', () => {
      // Arrange
      const mockConsole = createMockConsole();
      const messages = ['message 1', 'message 2', 'message 3'];
      
      // Act
      messages.forEach(msg => mockConsole.log(msg));
      
      // Assert
      const output = mockConsole.getOutput();
      expect(output).toHaveLength(messages.length);
      messages.forEach(msg => {
        expect(output).toContain(msg);
      });
    });
    
    it('should capture error messages with args', () => {
      // Arrange
      const mockConsole = createMockConsole();
      
      // Act
      mockConsole.error('error message', 'detail1', 'detail2');
      
      // Assert
      const output = mockConsole.getOutput();
      expect(output[0]).toContain('ERROR: error message detail1 detail2');
    });
    
    it('should handle logWithLevel for log level', () => {
      // Arrange
      const mockConsole = createMockConsole();
      const message = 'log level message';
      
      // Act
      mockConsole.logWithLevel('log', message);
      
      // Assert
      const output = mockConsole.getOutput();
      expect(output).toContain(message);
    });
    
    it('should handle logWithLevel for error level', () => {
      // Arrange
      const mockConsole = createMockConsole();
      const message = 'error level message';
      const args = ['detail1', 'detail2'];
      
      // Act
      mockConsole.logWithLevel('error', message, ...args);
      
      // Assert
      const output = mockConsole.getOutput();
      expect(output[0]).toContain('ERROR: error level message detail1 detail2');
    });
  });
});
