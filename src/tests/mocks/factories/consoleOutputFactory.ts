import { MockConsoleOutput } from '../implementations/mockConsoleOutput.js';
import type { ConsoleOutput } from '../../../interfaces/consoleOutput.js';
import { MockOptions } from './types.js';

/**
 * Options for creating a mock console output
 */
export interface ConsoleOutputOptions extends MockOptions<ConsoleOutput> {
  /** Whether to capture output for later retrieval */
  captureOutput?: boolean;
}

/**
 * Creates a mock console output for testing
 * @param options Options for configuring the mock
 * @returns A mock console output instance
 */
export function createMockConsoleOutput(options: ConsoleOutputOptions = {}): MockConsoleOutput {
  const mockConsoleOutput = new MockConsoleOutput();
  
  // Apply any custom implementations
  if (options.implementation) {
    Object.entries(options.implementation).forEach(([key, value]) => {
      // We need to cast here because we're dynamically setting properties
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockConsoleOutput as any)[key] = value;
    });
  }
  
  return mockConsoleOutput;
}
