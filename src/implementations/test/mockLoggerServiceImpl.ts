import { injectable } from 'tsyringe';
import { LoggerService } from '../../interfaces/loggerService.js';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Mock implementation of LoggerService for testing.
 * Captures log calls for verification in tests without producing output.
 */
@injectable()
export class MockLoggerServiceImpl implements LoggerService {
  public readonly calls: LogCall[] = [];

  info(contextOrMessage: Record<string, unknown> | string, message?: string): void {
    this.recordCall('info', contextOrMessage, message);
  }

  warn(contextOrMessage: Record<string, unknown> | string, message?: string): void {
    this.recordCall('warn', contextOrMessage, message);
  }

  error(contextOrMessage: Record<string, unknown> | string, message?: string): void {
    this.recordCall('error', contextOrMessage, message);
  }

  debug(contextOrMessage: Record<string, unknown> | string, message?: string): void {
    this.recordCall('debug', contextOrMessage, message);
  }

  child(_context: Record<string, unknown>): LoggerService {
    return new MockLoggerServiceImpl();
  }

  /**
   * Clear all recorded log calls (useful for test cleanup)
   */
  clear(): void {
    this.calls.length = 0;
  }

  /**
   * Get all calls of a specific level
   */
  getCallsOfLevel(level: LogLevel): LogCall[] {
    return this.calls.filter(call => call.level === level);
  }

  /**
   * Check if a specific message was logged
   */
  hasMessage(message: string): boolean {
    return this.calls.some(call => call.message === message);
  }

  /**
   * Check if a log call with specific context was made
   */
  hasContext(context: Record<string, unknown>): boolean {
    return this.calls.some(call => {
      if (call.context === undefined) {
        return false;
      }
      return Object.keys(context).every(key => call.context?.[key] === context[key]);
    });
  }

  private recordCall(
    level: LogLevel,
    contextOrMessage: Record<string, unknown> | string,
    message?: string
  ): void {
    if (typeof contextOrMessage === 'string') {
      this.calls.push({
        level,
        message: contextOrMessage,
        context: undefined,
        timestamp: new Date()
      });
    } else {
      this.calls.push({
        level,
        message: message ?? '',
        context: contextOrMessage,
        timestamp: new Date()
      });
    }
  }
}

/**
 * Represents a captured log call for testing verification
 */
export interface LogCall {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: Date;
}
