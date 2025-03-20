/* eslint-disable no-console */
/**
 * Console output wrapper for better testability.
 * Allows mocking of console output in tests while maintaining type safety.
 */
export interface ConsoleOutput {
  log: (message?: string) => void;
  error: (message?: string, ...args: unknown[]) => void;
  logWithLevel: (level: 'log' | 'error', message?: string, ...args: unknown[]) => void;
}

export const consoleOutput: ConsoleOutput = {
  log: (message?: string): void => {
    console.log(message);
  },
  error: (message?: string, ...args: unknown[]): void => {
    console.error(message, ...args);
  },
  logWithLevel: (level: 'log' | 'error', message?: string, ...args: unknown[]): void => {
    if (level === 'log') {
      // Using error instead of log to comply with project standards
      console.error(message);
    } else {
      console.error(message, ...args);
    }
  }
};

/**
 * Creates a mock console for testing.
 * Captures all output for verification in tests.
 */
export const createMockConsole = (): ConsoleOutput & { 
  getOutput: () => { logs: string[]; errors: string[] } 
} => {
  const logs: string[] = [];
  const errors: string[] = [];

  return {
    log: (message?: string): void => {
      logs.push(message ?? '');
    },
    error: (message?: string, ...args: unknown[]): void => {
      errors.push(`${message ?? ''} ${args.join(' ')}`);
    },
    logWithLevel: (level: 'log' | 'error', message?: string, ...args: unknown[]): void => {
      if (level === 'log') {
        logs.push(message ?? '');
      } else {
        errors.push(`${message ?? ''} ${args.join(' ')}`);
      }
    },
    getOutput: () => ({ logs, errors })
  };
};
