import { describe, expect, it, jest } from '@jest/globals';
import { consoleOutput, createMockConsole } from '../../utils/console.js';

describe('Console Utilities', () => {
  describe('consoleOutput', () => {
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

    it('should log messages correctly', () => {
      // Arrange
      const message = 'test message';

      // Act
      consoleOutput.log(message);

      // Assert
      expect(console.log).toHaveBeenCalledWith(message);
    });

    it('should handle undefined log messages', () => {
      // Act
      consoleOutput.log(undefined);

      // Assert
      expect(console.log).toHaveBeenCalledWith(undefined);
    });

    it('should log errors correctly', () => {
      // Arrange
      const message = 'error message';
      const args = ['arg1', 'arg2'];

      // Act
      consoleOutput.error(message, ...args);

      // Assert
      expect(console.error).toHaveBeenCalledWith(message, ...args);
    });

    it('should handle undefined error messages', () => {
      // Arrange
      const args = ['arg1'];

      // Act
      consoleOutput.error(undefined, ...args);

      // Assert
      expect(console.error).toHaveBeenCalledWith(undefined, ...args);
    });
  });

  describe('createMockConsole', () => {
    it('should capture log messages', () => {
      // Arrange
      const mockConsole = createMockConsole();

      // Act
      mockConsole.log('test message');
      mockConsole.log('another message');

      // Assert
      const output = mockConsole.getOutput();
      expect(output.logs).toEqual(['test message', 'another message']);
      expect(output.errors).toEqual([]);
    });

    it('should handle undefined log messages', () => {
      // Arrange
      const mockConsole = createMockConsole();

      // Act
      mockConsole.log(undefined);

      // Assert
      const output = mockConsole.getOutput();
      expect(output.logs).toEqual(['']);
    });

    it('should capture error messages with args', () => {
      // Arrange
      const mockConsole = createMockConsole();

      // Act
      mockConsole.error('error 1', 'detail');
      mockConsole.error('error 2', 'more', 'details');

      // Assert
      const output = mockConsole.getOutput();
      expect(output.logs).toEqual([]);
      expect(output.errors).toEqual([
        'error 1 detail',
        'error 2 more details'
      ]);
    });

    it('should handle undefined error messages', () => {
      // Arrange
      const mockConsole = createMockConsole();

      // Act
      mockConsole.error(undefined, 'arg1');

      // Assert
      const output = mockConsole.getOutput();
      expect(output.errors).toEqual([' arg1']);
    });
  });
});
