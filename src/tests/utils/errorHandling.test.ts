/**
 * Tests for error handling utilities
 */
/* eslint-disable jest/unbound-method */
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  formatError, 
  handleMainError, 
  isDirectExecution, 
  generateDebugInfo,
  safeResolve,
  registerGlobalErrorHandler
} from '../../utils/errorHandling.js';
import type { ConsoleOutput } from '../../interfaces/consoleOutput.js';
import type { Show } from '../../schemas/domain.js';

describe('errorHandling', () => {
  describe('formatError', () => {
    it('should format Error objects', () => {
      const error = new Error('Test error');
      expect(formatError(error)).toBe('Test error');
    });

    it('should format string errors', () => {
      expect(formatError('String error')).toBe('String error');
    });

    it('should format number errors', () => {
      expect(formatError(42)).toBe('42');
    });

    it('should format null errors', () => {
      expect(formatError(null)).toBe('null');
    });

    it('should add prefix when provided', () => {
      const error = new Error('Test error');
      expect(formatError(error, 'Prefix: ')).toBe('Prefix: Test error');
    });
  });

  describe('handleMainError', () => {
    let mockConsoleOutput: ConsoleOutput;
    let originalExit: typeof process.exit;
    let exitCalled = false;
    let exitCode = 0;

    beforeEach(() => {
      mockConsoleOutput = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        logWithLevel: jest.fn()
      } as unknown as ConsoleOutput;
      
      originalExit = process.exit;
      // Create separate functions to avoid unbound method lint errors
      const exitMock = (code?: number | undefined): never => {
        exitCalled = true;
        exitCode = code !== undefined ? code : 0;
        return undefined as never;
      };
      process.exit = exitMock;
    });

    afterEach(() => {
      process.exit = originalExit;
      exitCalled = false;
      exitCode = 0;
    });

    it('should log error message', () => {
      const error = new Error('Test error');
      handleMainError(error, mockConsoleOutput);
      
      expect(mockConsoleOutput.error).toHaveBeenCalledWith(
        'Unhandled error in main: Test error'
      );
      expect(exitCalled).toBe(true);
      expect(exitCode).toBe(1);
    });

    it('should log error stack when available', () => {
      const error = new Error('Test error');
      handleMainError(error, mockConsoleOutput);
      
      expect(mockConsoleOutput.error).toHaveBeenCalledTimes(2);
      expect(mockConsoleOutput.error).toHaveBeenCalledWith(
        expect.stringContaining('Stack: Error: Test error')
      );
    });

    it('should handle non-Error objects', () => {
      handleMainError('String error', mockConsoleOutput);
      
      expect(mockConsoleOutput.error).toHaveBeenCalledWith(
        'Unhandled error in main: String error'
      );
      expect(mockConsoleOutput.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('isDirectExecution', () => {
    let originalNodeEnv: string | undefined;

    beforeEach(() => {
      originalNodeEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should return false in test environment', () => {
      process.env.NODE_ENV = 'test';
      expect(isDirectExecution()).toBe(false);
    });

    it('should return true in non-test environment', () => {
      process.env.NODE_ENV = 'production';
      expect(isDirectExecution()).toBe(true);
    });

    it('should return true when NODE_ENV is undefined', () => {
      delete process.env.NODE_ENV;
      expect(isDirectExecution()).toBe(true);
    });
  });

  describe('generateDebugInfo', () => {
    it('should generate debug info with empty shows array', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const shows: Show[] = [];
      
      const result = generateDebugInfo(shows, date);
      
      expect(result).toEqual({
        dateFormatted: expect.any(String),
        networks: [],
        totalShows: 0
      });
    });

    it('should generate debug info with shows', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const shows: Show[] = [
        { id: 1, name: 'Show 1', network: 'ABC' },
        { id: 2, name: 'Show 2', network: 'NBC' },
        { id: 3, name: 'Show 3', network: 'ABC' }
      ] as Show[];
      
      const result = generateDebugInfo(shows, date);
      
      expect(result).toEqual({
        dateFormatted: expect.any(String),
        networks: ['ABC', 'NBC'],
        totalShows: 3
      });
    });

    it('should handle shows without network information', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const shows: Show[] = [
        { id: 1, name: 'Show 1', network: 'ABC' },
        { id: 2, name: 'Show 2' },
        { id: 3, name: 'Show 3', network: null }
      ] as Show[];
      
      const result = generateDebugInfo(shows, date);
      
      expect(result).toEqual({
        dateFormatted: expect.any(String),
        networks: ['ABC'],
        totalShows: 3
      });
    });
  });

  describe('safeResolve', () => {
    it('should resolve successfully', async () => {
      await expect(safeResolve()).resolves.toBeUndefined();
    });
  });

  describe('registerGlobalErrorHandler', () => {
    let mockConsoleOutput: ConsoleOutput;
    let originalExit: typeof process.exit;
    let originalProcessOn: typeof process.on;
    let exitCalled = false;
    let exitCode = 0;
    let registeredEvent = '';
    let registeredCallback: ((error: Error) => void) | null = null;

    beforeEach(() => {
      mockConsoleOutput = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        logWithLevel: jest.fn()
      } as unknown as ConsoleOutput;
      
      originalExit = process.exit;
      // Create separate functions to avoid unbound method lint errors
      const exitMock = (code?: number | undefined): never => {
        exitCalled = true;
        exitCode = code !== undefined ? code : 0;
        return undefined as never;
      };
      process.exit = exitMock;
      
      originalProcessOn = process.on;
      // Mock process.on to capture the event and callback
      const processOnMock = (event: string, callback: (error: Error) => void): typeof process => {
        registeredEvent = event;
        registeredCallback = callback;
        return process;
      };
      process.on = jest.fn(processOnMock) as unknown as typeof process.on;
      
      registerGlobalErrorHandler(mockConsoleOutput);
    });

    afterEach(() => {
      process.exit = originalExit;
      process.on = originalProcessOn;
      exitCalled = false;
      exitCode = 0;
    });

    it('should register uncaughtException handler', () => {
      expect(registeredEvent).toBe('uncaughtException');
      expect(typeof registeredCallback).toBe('function');
    });

    it('should handle Error objects', () => {
      if (registeredCallback) {
        const error = new Error('Test uncaught exception');
        error.stack = 'Error stack trace';
        
        registeredCallback(error);
        
        expect(mockConsoleOutput.error).toHaveBeenCalledWith('Uncaught Exception:');
        expect(mockConsoleOutput.error).toHaveBeenCalledWith('Error: Test uncaught exception');
        expect(mockConsoleOutput.error).toHaveBeenCalledWith('Error stack trace');
        expect(exitCalled).toBe(true);
        expect(exitCode).toBe(1);
      }
    });

    it('should handle errors without stack', () => {
      if (registeredCallback) {
        const error = new Error('Test error without stack');
        error.stack = '';
        
        registeredCallback(error);
        
        expect(mockConsoleOutput.error).toHaveBeenCalledWith('Uncaught Exception:');
        expect(mockConsoleOutput.error).toHaveBeenCalledWith('Error: Test error without stack');
        expect(mockConsoleOutput.error).toHaveBeenCalledTimes(2);
        expect(exitCalled).toBe(true);
        expect(exitCode).toBe(1);
      }
    });

    it('should handle non-Error objects', () => {
      if (registeredCallback) {
        registeredCallback('String error' as unknown as Error);
        
        expect(mockConsoleOutput.error).toHaveBeenCalledWith('Uncaught Exception:');
        expect(mockConsoleOutput.error).toHaveBeenCalledWith('String error');
        expect(exitCalled).toBe(true);
        expect(exitCode).toBe(1);
      }
    });
  });
});
