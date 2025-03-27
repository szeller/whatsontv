/**
 * Interface for low-level console operations
 * Provides a wrapper around console functions for better testability
 */
export interface ConsoleOutput {
  /**
   * Log a message to the console
   * @param message Message to log
   */
  log: (message?: string) => void;
  
  /**
   * Log an error message to the console
   * @param message Error message
   * @param args Additional arguments
   */
  error: (message?: string, ...args: unknown[]) => void;
  
  /**
   * Log a warning message to the console
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
