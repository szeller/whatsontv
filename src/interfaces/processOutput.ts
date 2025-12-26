/**
 * Interface for low-level process I/O operations
 * Provides a wrapper around console functions for better testability
 * Used by both CLI and Lambda for stdout/stderr output
 */
export interface ProcessOutput {
  /**
   * Log a message to stdout
   * @param message Message to log
   */
  log: (message?: string) => void;

  /**
   * Log an error message to stderr
   * @param message Error message
   * @param args Additional arguments
   */
  error: (message?: string, ...args: unknown[]) => void;

  /**
   * Log a warning message to stderr
   * @param message Warning message
   * @param args Additional arguments
   */
  warn: (message?: string, ...args: unknown[]) => void;

  /**
   * Log a message with a specific level
   * @param level Log level (log or error)
   * @param message Message to log
   * @param args Additional arguments
   */
  logWithLevel: (level: 'log' | 'error', message?: string, ...args: unknown[]) => void;
}
