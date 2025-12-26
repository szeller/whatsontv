/**
 * Process output test helpers
 * Provides utilities for testing process output
 */

import type { ProcessOutput } from '../../interfaces/processOutput.js';

/**
 * Creates a mock process output for testing.
 * Captures all output for verification in tests.
 * @returns Mock process output implementation with getOutput method
 */
export function createMockConsole(): ProcessOutput & { getOutput: () => string[] } {
  const output: string[] = [];
  
  return {
    log: (message?: string): void => {
      if (message !== undefined) {
        output.push(message);
      }
    },
    error: (message?: string, ...args: unknown[]): void => {
      if (message !== undefined) {
        output.push(`ERROR: ${message} ${args.join(' ')}`);
      }
    },
    warn: (message?: string, ...args: unknown[]): void => {
      if (message !== undefined) {
        output.push(`WARN: ${message} ${args.join(' ')}`);
      }
    },
    logWithLevel: (level: 'log' | 'error', message?: string, ...args: unknown[]): void => {
      if (message !== undefined) {
        if (level === 'log') {
          output.push(message);
        } else {
          output.push(`ERROR: ${message} ${args.join(' ')}`);
        }
      }
    },
    getOutput: (): string[] => output
  };
}
