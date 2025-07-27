/**
 * Slack CLI Tests
 * 
 * Tests for Slack CLI error handling and service resolution
 */
import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals';
import { container } from '../../slackContainer.js';
import { createSlackApp, createSlackAppWithContainer } from '../../cli/slackCli.js';

describe('Slack CLI Tests', () => {
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    // Save original console methods
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    
    // Mock console methods to suppress output during tests
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('createSlackApp', () => {
    test('should create Slack app using global container', () => {
      // This tests the main createSlackApp function (line 31)
      const app = createSlackApp();
      expect(app).toBeDefined();
      expect(typeof app.run).toBe('function');
    });
  });

  describe('createSlackAppWithContainer error handling', () => {


    test('should handle missing SlackOutputService registration', () => {
      // Create a test container with a mock that throws specific error
      const testContainer = container.createChildContainer();
      
      const mockConsoleOutput = { error: jest.fn() };
      testContainer.register('ConsoleOutput', { useValue: mockConsoleOutput });
      
      // Mock resolve to throw error mentioning SlackOutputService
      testContainer.resolve = jest.fn().mockImplementation((serviceName: string) => {
        if (serviceName === 'ConsoleOutput') {
          return mockConsoleOutput;
        }
        throw new Error('SlackOutputService is not registered');
      });

      expect(() => {
        createSlackAppWithContainer(testContainer);
      }).toThrow('SlackOutputService is not registered');

      // Verify specific error handling for SlackOutputService (lines 62-64)
      expect(mockConsoleOutput.error).toHaveBeenCalledWith(
        expect.stringContaining('SlackOutputService')
      );
    });

    test('should handle missing SlackFormatter registration with specific error message', () => {
      // Create a test container with a mock that throws specific error
      const testContainer = container.createChildContainer();
      
      const mockConsoleOutput = { error: jest.fn() };
      testContainer.register('ConsoleOutput', { useValue: mockConsoleOutput });
      
      // Mock resolve to throw error mentioning SlackFormatter
      testContainer.resolve = jest.fn().mockImplementation((serviceName: string) => {
        if (serviceName === 'ConsoleOutput') {
          return mockConsoleOutput;
        }
        throw new Error('SlackFormatter is not registered');
      });

      expect(() => {
        createSlackAppWithContainer(testContainer);
      }).toThrow('SlackFormatter is not registered');

      // Verify specific error handling for SlackFormatter (lines 59-61)
      expect(mockConsoleOutput.error).toHaveBeenCalledWith(
        expect.stringContaining('SlackFormatter')
      );
    });

    test('should handle generic service resolution errors', () => {
      // Create a test container with a mock that throws generic error
      const testContainer = container.createChildContainer();
      
      const mockConsoleOutput = { error: jest.fn() };
      testContainer.register('ConsoleOutput', { useValue: mockConsoleOutput });
      
      // Mock resolve to throw generic error
      testContainer.resolve = jest.fn().mockImplementation((serviceName: string) => {
        if (serviceName === 'ConsoleOutput') {
          return mockConsoleOutput;
        }
        throw new Error('Generic service resolution error');
      });

      expect(() => {
        createSlackAppWithContainer(testContainer);
      }).toThrow('Generic service resolution error');

      // Verify general error handling (lines 55-56)
      expect(mockConsoleOutput.error).toHaveBeenCalledWith(
        expect.stringContaining('Error resolving services')
      );
    });
  });
});
