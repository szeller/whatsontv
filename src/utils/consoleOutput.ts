/* eslint-disable no-console */
/**
 * Console output wrapper for better testability.
 * Allows mocking of console output in tests while maintaining type safety.
 */
import type { ConsoleOutput } from '../interfaces/consoleOutput.js';

/**
 * Implementation of the ConsoleOutput interface
 * Provides a wrapper around native console functions
 */
export const consoleOutput: ConsoleOutput = {
  log: (message?: string): void => {
    console.log(message);
  },
  error: (message?: string, ...args: unknown[]): void => {
    console.error(message, ...args);
  },
  logWithLevel: (level: 'log' | 'error', message?: string, ...args: unknown[]): void => {
    if (level === 'log') {
      console.log(message);
    } else {
      console.error(message, ...args);
    }
  }
};

/**
 * Creates a mock console for testing.
 * Captures all output for verification in tests.
 * @returns Mock console implementation with getOutput method
 */
export function createMockConsole(): ConsoleOutput & { getOutput: () => string[] } {
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
