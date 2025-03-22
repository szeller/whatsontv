/**
 * Jest setup file for all tests
 * This file runs before each test file
 */
import 'reflect-metadata';
import { jest } from '@jest/globals';

// Import test helpers
import { createMockYargs, mockYargs } from './helpers/yargsHelper.js';

// Create mock yargs instance for tests
const yargsInstance = createMockYargs();
mockYargs(yargsInstance);

// Mock console output utility module
jest.mock('../utils/consoleOutput', () => ({
  __esModule: true,
  consoleOutput: {
    log: jest.fn(),
    error: jest.fn(),
    logWithLevel: jest.fn()
  }
}));

// Mock chalk for consistent output
jest.mock('chalk', () => ({
  __esModule: true,
  default: Object.assign(
    (str: string): string => str,
    { 
      bold: (str: string): string => str,
      green: (str: string): string => str,
      red: (str: string): string => str,
      yellow: (str: string): string => str,
      blue: (str: string): string => str,
      magenta: (str: string): string => str,
      cyan: (str: string): string => str
    }
  )
}));

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
