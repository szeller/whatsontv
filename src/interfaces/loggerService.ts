/**
 * Logger service interface for structured logging throughout the application.
 * Provides consistent logging capabilities with contextual information.
 */
export interface LoggerService {
  /**
   * Log an informational message with optional context
   * @param context - Additional context data to include in the log
   * @param message - The log message
   */
  info(context: Record<string, unknown>, message: string): void;
  info(message: string): void;

  /**
   * Log a warning message with optional context
   * @param context - Additional context data to include in the log
   * @param message - The log message
   */
  warn(context: Record<string, unknown>, message: string): void;
  warn(message: string): void;

  /**
   * Log an error message with optional context
   * @param context - Additional context data to include in the log
   * @param message - The log message
   */
  error(context: Record<string, unknown>, message: string): void;
  error(message: string): void;

  /**
   * Log a debug message with optional context
   * @param context - Additional context data to include in the log
   * @param message - The log message
   */
  debug(context: Record<string, unknown>, message: string): void;
  debug(message: string): void;

  /**
   * Create a child logger with additional context that will be included
   * in all subsequent log messages from this logger instance
   * @param context - Context to include in all messages from child logger
   * @returns A new logger instance with the additional context
   */
  child(context: Record<string, unknown>): LoggerService;
}
