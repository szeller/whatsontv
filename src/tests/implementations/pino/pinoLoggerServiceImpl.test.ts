import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PinoLoggerServiceImpl } from '../../../implementations/pino/pinoLoggerServiceImpl.js';

describe('PinoLoggerServiceImpl', () => {
  let loggerService: PinoLoggerServiceImpl;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    // Set test environment to ensure silent logging
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'silent';
    
    loggerService = new PinoLoggerServiceImpl();
    
    // Spy on console to capture any output that might leak through
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { /* noop */ });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    delete process.env.LOG_LEVEL;
  });

  describe('logging methods', () => {
    it('should provide info logging method', () => {
      expect(() => {
        loggerService.info('Test info message');
      }).not.toThrow();
    });

    it('should provide info logging with context', () => {
      expect(() => {
        loggerService.info({ requestId: '123' }, 'Test info with context');
      }).not.toThrow();
    });

    it('should provide warn logging method', () => {
      expect(() => {
        loggerService.warn('Test warn message');
      }).not.toThrow();
    });

    it('should provide warn logging with context', () => {
      expect(() => {
        loggerService.warn({ module: 'test' }, 'Test warn with context');
      }).not.toThrow();
    });

    it('should provide error logging method', () => {
      expect(() => {
        loggerService.error('Test error message');
      }).not.toThrow();
    });

    it('should provide error logging with context', () => {
      expect(() => {
        loggerService.error({ error: 'TestError' }, 'Test error with context');
      }).not.toThrow();
    });

    it('should provide debug logging method', () => {
      expect(() => {
        loggerService.debug('Test debug message');
      }).not.toThrow();
    });

    it('should provide debug logging with context', () => {
      expect(() => {
        loggerService.debug({ trace: 'test' }, 'Test debug with context');
      }).not.toThrow();
    });
  });

  describe('child logger', () => {
    it('should create child logger with additional context', () => {
      const childLogger = loggerService.child({ module: 'test', requestId: '123' });
      
      expect(childLogger).toBeDefined();
      expect(typeof childLogger.info).toBe('function');
      expect(typeof childLogger.error).toBe('function');
      expect(typeof childLogger.warn).toBe('function');
      expect(typeof childLogger.debug).toBe('function');
    });

    it('should allow child logger to create its own child', () => {
      const childLogger = loggerService.child({ module: 'test' });
      const grandChildLogger = childLogger.child({ operation: 'fetch' });

      expect(grandChildLogger).toBeDefined();
      expect(typeof grandChildLogger.info).toBe('function');
    });

    it('should allow child logger to log with string-only argument', () => {
      const childLogger = loggerService.child({ module: 'test' });

      // Test all logging methods with string-only arguments
      expect(() => { childLogger.info('string-only info'); }).not.toThrow();
      expect(() => { childLogger.warn('string-only warn'); }).not.toThrow();
      expect(() => { childLogger.error('string-only error'); }).not.toThrow();
      expect(() => { childLogger.debug('string-only debug'); }).not.toThrow();
    });

    it('should allow child logger to log with context and message', () => {
      const childLogger = loggerService.child({ module: 'test' });

      // Test all logging methods with context object and message
      expect(() => { childLogger.info({ key: 'value' }, 'info with context'); }).not.toThrow();
      expect(() => { childLogger.warn({ key: 'value' }, 'warn with context'); }).not.toThrow();
      expect(() => { childLogger.error({ key: 'value' }, 'error with context'); }).not.toThrow();
      expect(() => { childLogger.debug({ key: 'value' }, 'debug with context'); }).not.toThrow();
    });
  });

  describe('log level configuration', () => {
    it('should handle production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      delete process.env.LOG_LEVEL;
      
      expect(() => {
        new PinoLoggerServiceImpl();
      }).not.toThrow();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      delete process.env.LOG_LEVEL;
      
      expect(() => {
        new PinoLoggerServiceImpl();
      }).not.toThrow();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle custom log level', () => {
      process.env.LOG_LEVEL = 'info';
      
      expect(() => {
        new PinoLoggerServiceImpl();
      }).not.toThrow();
    });

    it('should handle invalid log level gracefully', () => {
      process.env.LOG_LEVEL = 'invalid';
      
      expect(() => {
        new PinoLoggerServiceImpl();
      }).not.toThrow();
    });
  });

  describe('environment integration', () => {
    it('should handle AWS Lambda environment', () => {
      const originalLambdaName = process.env.AWS_LAMBDA_FUNCTION_NAME;
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-lambda';
      
      expect(() => {
        new PinoLoggerServiceImpl();
      }).not.toThrow();
      
      if (originalLambdaName !== undefined) {
        process.env.AWS_LAMBDA_FUNCTION_NAME = originalLambdaName;
      } else {
        delete process.env.AWS_LAMBDA_FUNCTION_NAME;
      }
    });
  });
});
