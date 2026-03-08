import { injectable } from 'tsyringe';
import pino, { Logger } from 'pino';
import { hostname } from 'node:os';
import { LoggerService } from '../../interfaces/loggerService.js';

/** Dispatch a log call to the appropriate pino method */
function logMessage(
  logger: Logger,
  level: 'info' | 'warn' | 'error' | 'debug',
  contextOrMessage: Record<string, unknown> | string,
  message?: string
): void {
  if (typeof contextOrMessage === 'string') {
    logger[level](contextOrMessage);
  } else {
    logger[level](contextOrMessage, message);
  }
}

/**
 * Pino-based implementation of LoggerService for structured logging.
 * Provides high-performance JSON logging with configurable levels.
 */
@injectable()
export class PinoLoggerServiceImpl implements LoggerService {
  private readonly logger: Logger;

  constructor() {
    this.logger = pino({
      level: this.getLogLevel(),
      formatters: {
        level: (label: string): { level: string } => {
          return { level: label };
        }
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      base: {
        pid: process.pid,
        hostname: process.env.AWS_LAMBDA_FUNCTION_NAME ?? hostname(),
        environment: process.env.NODE_ENV ?? 'development'
      }
    });
  }

  info(contextOrMessage: Record<string, unknown> | string, message?: string): void {
    logMessage(this.logger, 'info', contextOrMessage, message);
  }

  warn(contextOrMessage: Record<string, unknown> | string, message?: string): void {
    logMessage(this.logger, 'warn', contextOrMessage, message);
  }

  error(contextOrMessage: Record<string, unknown> | string, message?: string): void {
    logMessage(this.logger, 'error', contextOrMessage, message);
  }

  debug(contextOrMessage: Record<string, unknown> | string, message?: string): void {
    logMessage(this.logger, 'debug', contextOrMessage, message);
  }

  child(context: Record<string, unknown>): LoggerService {
    const childLogger = this.logger.child(context);
    return new PinoLoggerServiceWrapper(childLogger);
  }

  private getLogLevel(): string {
    const level = process.env.LOG_LEVEL?.toLowerCase();
    const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

    if (level !== undefined && validLevels.includes(level)) {
      return level;
    }

    // Default log levels by environment
    switch (process.env.NODE_ENV) {
    case 'production': {
      return 'info';
    }
    case 'test': {
      return 'silent';
    }
    case 'development':
    case undefined: {
      return 'warn';
    }
    default: {
      return 'warn';
    }
    }
  }
}

/**
 * Wrapper class for child loggers to maintain LoggerService interface
 */
class PinoLoggerServiceWrapper implements LoggerService {
  constructor(private readonly logger: Logger) {}

  info(contextOrMessage: Record<string, unknown> | string, message?: string): void {
    logMessage(this.logger, 'info', contextOrMessage, message);
  }

  warn(contextOrMessage: Record<string, unknown> | string, message?: string): void {
    logMessage(this.logger, 'warn', contextOrMessage, message);
  }

  error(contextOrMessage: Record<string, unknown> | string, message?: string): void {
    logMessage(this.logger, 'error', contextOrMessage, message);
  }

  debug(contextOrMessage: Record<string, unknown> | string, message?: string): void {
    logMessage(this.logger, 'debug', contextOrMessage, message);
  }

  child(context: Record<string, unknown>): LoggerService {
    const childLogger = this.logger.child(context);
    return new PinoLoggerServiceWrapper(childLogger);
  }
}
