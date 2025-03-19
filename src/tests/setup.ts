import { jest } from '@jest/globals';

// Import and configure test helpers
import { createMockYargs, mockYargs } from './helpers/yargsHelper';

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
jest.mock('../utils/console', () => ({
  __esModule: true,
  consoleOutput: { 
    log: jest.fn().mockReturnValue(undefined),
    error: jest.fn().mockReturnValue(undefined)
  }
}));
