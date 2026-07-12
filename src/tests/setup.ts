/**
 * Jest setup file for all tests
 * This file runs before each test file
 */
import 'reflect-metadata';
import { jest } from '@jest/globals';

// Import test helpers
import { createMockYargs, mockYargs } from './helpers/yargsHelper.js';
// Import custom matchers and utilities
import './utils/assertions.js';

// Create mock yargs instance for tests
const yargsInstance = createMockYargs();
mockYargs(yargsInstance);

// No longer mocking consoleOutput as it's been removed
// Use consoleTestHelpers.ts instead for console mocking

// Mock chalk for consistent output
jest.mock('chalk', () => ({
  __esModule: true,
  default: Object.assign(
    (string_: string): string => string_,
    { 
      bold: (string_: string): string => string_,
      green: (string_: string): string => string_,
      red: (string_: string): string => string_,
      yellow: (string_: string): string => string_,
      blue: (string_: string): string => string_,
      magenta: (string_: string): string => string_,
      cyan: (string_: string): string => string_
    }
  )
}));

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
