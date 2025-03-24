import 'reflect-metadata';
import { injectable } from 'tsyringe';

import type { ConsoleOutput } from '../../interfaces/consoleOutput.js';

/**
 * Mock implementation of ConsoleOutput for testing
 * Captures all output for verification in tests
 */
@injectable()
export class MockConsoleOutputImpl implements ConsoleOutput {
  private output: string[] = [];
  
  /**
   * Log a message to the captured output
   * @param message Message to log
   */
  log(message?: string): void {
    if (message !== undefined) {
      this.output.push(message);
    }
  }

  /**
   * Log an error message to the captured output
   * @param message Error message to log
   * @param args Additional arguments
   */
  error(message?: string, ...args: unknown[]): void {
    if (message !== undefined) {
      this.output.push(`ERROR: ${message} ${args.join(' ')}`);
    }
  }

  /**
   * Log a warning message to the captured output
   * @param message Warning message to log
   * @param args Additional arguments
   */
  warn(message?: string, ...args: unknown[]): void {
    if (message !== undefined) {
      this.output.push(`WARN: ${message} ${args.join(' ')}`);
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
      } else {
        this.output.push(`ERROR: ${message} ${args.join(' ')}`);
      }
    }
  }

  /**
   * Get the captured output
   * @returns Array of captured output lines
   */
  getOutput(): string[] {
    return this.output;
  }

  /**
   * Clear the captured output
   */
  clearOutput(): void {
    this.output = [];
  }
}
