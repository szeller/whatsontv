import { jest } from '@jest/globals';
import { createMockYargs, mockYargs } from './helpers/yargsHelper.js';

// Setup yargs mock
const yargsInstance = createMockYargs();
mockYargs(yargsInstance);

// Mock chalk for consistent output
jest.mock('chalk', () => ({
  __esModule: true,
  default: Object.assign(
    (str: string): string => str,
    { 
      bold: (str: string): string => str 
    }
  )
}));

// Mock console utility module
jest.mock('../utils/console.js', () => ({
  consoleOutput: {
    log: jest.fn(),
    error: jest.fn()
  }
}));

// Export mocks for tests
export const mockYargsExit = yargsInstance.exit;
