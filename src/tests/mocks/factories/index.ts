/**
 * Barrel file that re-exports all factory functions
 * This allows for simple imports:
 * import { createMockConsoleOutput, createMockHttpClient } from '../mocks/factories';
 */

// Re-export types
export * from './types.js';

// Factory exports
export * from './consoleOutputFactory.js';
export * from './httpClientFactory.js';

// As we implement each factory, we'll add exports here
// export * from './configServiceFactory.js';
// etc.
