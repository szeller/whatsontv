import 'reflect-metadata';
import { injectable } from 'tsyringe';

import type { ProcessOutput } from '../../../interfaces/processOutput.js';

/**
 * Mock implementation of ProcessOutput for testing
 * Captures all output for verification in tests
 */
@injectable()
export class MockProcessOutput implements ProcessOutput {
  private output: string[] = [];
  private calls: { method: string; args: unknown[] }[] = [];

  /**
   * Log a message to the captured output
   * @param message Message to log
   */
  log(message?: string): void {
    if (message !== undefined) {
      this.output.push(message);
      this.calls.push({ method: 'log', args: [message] });
    }
  }

  /**
   * Log an error message to stderr
   * @param message Error message to log
   * @param args Additional arguments
   */
  error(message?: string, ...args: unknown[]): void {
    if (message !== undefined) {
      // Simply store the message as-is, without any formatting
      // This allows tests to check for exact message content
      this.output.push(message);

      // If there are additional args, store them as separate entries
      if (args.length > 0) {
        args.forEach(arg => {
          if (arg !== undefined && arg !== null) {
            this.output.push(String(arg));
          }
        });
      }

      this.calls.push({ method: 'error', args: [message, ...args] });
    }
  }

  /**
   * Log a warning message to the captured output
   * @param message Warning message to log
   * @param args Additional arguments
   */
  warn(message?: string, ...args: unknown[]): void {
    if (message !== undefined) {
      // Format the warning message similar to console.warn
      // Don't add WARN: prefix as the real implementation doesn't
      this.output.push(`${message}${args.length > 0 ? ' ' + args.join(' ') : ''}`);
      this.calls.push({ method: 'warn', args: [message, ...args] });
    }
  }

  /**
   * Log a message with a specific level to the captured output
   * @param level Log level (log or error)
   * @param message Message to log
   * @param args Additional arguments
   */
  logWithLevel(level: 'log' | 'error', message?: string, ...args: unknown[]): void {
    if (message !== undefined) {
      if (level === 'log') {
        this.output.push(message);
        this.calls.push({ method: 'logWithLevel', args: [level, message, ...args] });
      } else {
        // Format the error message similar to console.error
        this.output.push(`${message}${args.length > 0 ? ' ' + args.join(' ') : ''}`);
        this.calls.push({ method: 'logWithLevel', args: [level, message, ...args] });
      }
    }
  }

  /**
   * Get the captured output
   * @returns Array of captured output lines
   */
  getOutput(): string[] {
    return [...this.output];
  }

  /**
   * Clear the captured output
   */
  clearOutput(): void {
    this.output = [];
    this.calls = [];
  }

  /**
   * Debug method to print the current output to the console
   * Only for use in test environments
   * @param prefix Optional prefix to add to each line
   */
  debugOutput(prefix = 'MockProcessOutput'): void {
    // Using error since it's allowed by the linting rules
    console.error(`--- ${prefix} captured output ---`);
    this.output.forEach((line, index) => {
      console.error(`[${index}]: ${line}`);
    });
    console.error(`--- End of ${prefix} captured output ---`);
  }

  /**
   * Check if a method was called with specific arguments
   * @param method Method name to check
   * @param args Arguments to match
   * @returns True if the method was called with the specified arguments
   */
  wasCalledWith(method: string, ...args: unknown[]): boolean {
    return this.calls.some(call => {
      if (call.method !== method) {
        return false;
      }

      // For error messages, we want to check if the actual message contains the expected message
      // This is because error messages might have additional information or formatting
      if (
        args.length === 1 &&
        typeof args[0] === 'string' &&
        call.args.length > 0 &&
        typeof call.args[0] === 'string'
      ) {
        return call.args[0].includes(args[0]);
      }

      // For exact matches
      if (args.length === call.args.length) {
        return args.every((arg, index) => arg === call.args[index]);
      }

      return false;
    });
  }

  /**
   * Get all calls to a specific method
   * @param method Method name to get calls for
   * @returns Array of argument arrays for each call
   */
  getCallsTo(method: string): unknown[][] {
    return this.calls
      .filter(call => call.method === method)
      .map(call => call.args);
  }

  /**
   * Check if arguments match, handling partial matches
   * @param actual Actual arguments
   * @param expected Expected arguments
   * @returns True if arguments match
   */
  private argsMatch(actual: unknown[], expected: unknown[]): boolean {
    if (expected.length === 0) {
      return true;
    }

    if (expected.length > actual.length) {
      return false;
    }

    for (let i = 0; i < expected.length; i++) {
      const expectedArg = expected[i];
      const actualArg = actual[i];

      if (typeof expectedArg === 'string' && typeof actualArg === 'string') {
        if (!actualArg.includes(expectedArg)) {
          return false;
        }
      } else if (expectedArg !== actualArg) {
        return false;
      }
    }

    return true;
  }
}
