import { MockProcessOutput } from '../implementations/mockProcessOutput.js';
import type { ProcessOutput } from '../../../interfaces/processOutput.js';
import { MockOptions } from './types.js';

/**
 * Options for creating a mock process output
 */
export interface ProcessOutputOptions extends MockOptions<ProcessOutput> {
  /** Whether to capture output for later retrieval */
  captureOutput?: boolean;
}

/**
 * Creates a mock process output for testing
 * @param options Options for configuring the mock
 * @returns A mock process output instance
 */
export function createMockProcessOutput(options: ProcessOutputOptions = {}): MockProcessOutput {
  const mockProcessOutput = new MockProcessOutput();

  // Apply any custom implementations
  if (options.implementation) {
    Object.entries(options.implementation).forEach(([key, value]) => {
      // We need to cast here because we're dynamically setting properties
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockProcessOutput as any)[key] = value;
    });
  }

  return mockProcessOutput;
}
