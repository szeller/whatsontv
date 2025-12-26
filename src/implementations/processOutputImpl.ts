import 'reflect-metadata';
import { injectable } from 'tsyringe';

import type { ProcessOutput } from '../interfaces/processOutput.js';

/**
 * Implementation of the ProcessOutput interface
 * Provides a wrapper around native console functions for stdout/stderr
 * Used by both CLI and Lambda for process I/O
 */
@injectable()
export class ProcessOutputImpl implements ProcessOutput {
  /**
   * Log a message to stdout
   * @param message Message to log
   */
  /* eslint-disable no-console */
  log(message?: string): void {
    console.log(message);
  }

  /**
   * Log an error message to stderr
   * @param message Error message to log
   * @param args Additional arguments
   */
  error(message?: string, ...args: unknown[]): void {
    console.error(message, ...args);
  }

  /**
   * Log a warning message to stderr
   * @param message Warning message to log
   * @param args Additional arguments
   */
  warn(message?: string, ...args: unknown[]): void {
    console.warn(message, ...args);
  }

  /**
   * Log a message with a specific level
   * @param level Log level (log or error)
   * @param message Message to log
   * @param args Additional arguments
   */
  logWithLevel(level: 'log' | 'error', message?: string, ...args: unknown[]): void {
    if (level === 'log') {
      console.log(message);
    } else {
      console.error(message, ...args);
    }
  }
  /* eslint-enable no-console */
}
