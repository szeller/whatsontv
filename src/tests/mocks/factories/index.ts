/**
 * Barrel file that re-exports all factory functions
 * This allows for simple imports:
 * import { createMockProcessOutput, createMockHttpClient } from '../mocks/factories';
 */

// Re-export types
export type * from './types.js';

// Factory exports
export * from './processOutputFactory.js';
export * from './httpClientFactory.js';
export * from './configServiceFactory.js';
export * from './formatterFactory.js';
export * from './tvShowServiceFactory.js';
export * from './styleServiceFactory.js';
export * from './outputServiceFactory.js';

// As we implement each factory, we'll add exports here
// etc.
