/**
 * Factory for creating mock OutputService instances
 */
import { jest } from '@jest/globals';
import type { OutputService } from '../../../interfaces/outputService.js';
import type { Show } from '../../../schemas/domain.js';
import { MockOptions } from './types.js';

/**
 * Options for creating a mock output service
 */
export interface OutputServiceOptions extends MockOptions<OutputService> {
  /** Error to throw when renderOutput is called */
  renderError?: Error;
  
  /** Custom callback to execute when renderOutput is called */
  onRenderOutput?: (shows: Show[]) => void;
}

/**
 * Creates a mock output service for testing
 * @param options Options for configuring the mock
 * @returns A mock output service instance
 */
export function createMockOutputService(
  options: OutputServiceOptions = {}
): jest.Mocked<OutputService> {
  const mockOutputService: jest.Mocked<OutputService> = {
    renderOutput: jest.fn(async (shows: Show[]): Promise<void> => {
      // If we should throw an error, do so
      if (options.renderError) {
        throw options.renderError;
      }
      
      // If a custom callback is provided, execute it
      if (options.onRenderOutput) {
        options.onRenderOutput(shows);
      }
      
      // Default implementation does nothing
      return Promise.resolve();
    })
  };
  
  // Apply any custom implementations
  if (options.implementation) {
    Object.entries(options.implementation).forEach(([key, value]) => {
      // We need to cast here because we're dynamically setting properties
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockOutputService as any)[key] = value;
    });
  }
  
  return mockOutputService;
}
