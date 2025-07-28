import { describe, it, expect, beforeEach } from '@jest/globals';
import { MockLoggerServiceImpl } from '../../../implementations/test/mockLoggerServiceImpl.js';

describe('MockLoggerServiceImpl', () => {
  let mockLogger: MockLoggerServiceImpl;

  beforeEach(() => {
    mockLogger = new MockLoggerServiceImpl();
  });

  describe('logging methods', () => {
    it('should record info log calls', () => {
      mockLogger.info('Test info message');
      
      expect(mockLogger.calls).toHaveLength(1);
      expect(mockLogger.calls[0].level).toBe('info');
      expect(mockLogger.calls[0].message).toBe('Test info message');
      expect(mockLogger.calls[0].context).toBeUndefined();
    });

    it('should record info log calls with context', () => {
      const context = { requestId: '123', module: 'test' };
      mockLogger.info(context, 'Test info with context');
      
      expect(mockLogger.calls).toHaveLength(1);
      expect(mockLogger.calls[0].level).toBe('info');
      expect(mockLogger.calls[0].message).toBe('Test info with context');
      expect(mockLogger.calls[0].context).toEqual(context);
    });

    it('should record warn log calls', () => {
      mockLogger.warn('Test warn message');
      
      expect(mockLogger.calls).toHaveLength(1);
      expect(mockLogger.calls[0].level).toBe('warn');
      expect(mockLogger.calls[0].message).toBe('Test warn message');
    });

    it('should record error log calls', () => {
      mockLogger.error('Test error message');
      
      expect(mockLogger.calls).toHaveLength(1);
      expect(mockLogger.calls[0].level).toBe('error');
      expect(mockLogger.calls[0].message).toBe('Test error message');
    });

    it('should record debug log calls', () => {
      mockLogger.debug('Test debug message');
      
      expect(mockLogger.calls).toHaveLength(1);
      expect(mockLogger.calls[0].level).toBe('debug');
      expect(mockLogger.calls[0].message).toBe('Test debug message');
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      mockLogger.info('Info message');
      mockLogger.warn({ module: 'test' }, 'Warn message');
      mockLogger.error('Error message');
      mockLogger.debug({ trace: 'debug' }, 'Debug message');
    });

    it('should clear all recorded calls', () => {
      expect(mockLogger.calls).toHaveLength(4);
      
      mockLogger.clear();
      
      expect(mockLogger.calls).toHaveLength(0);
    });

    it('should filter calls by level', () => {
      const infoCalls = mockLogger.getCallsOfLevel('info');
      const warnCalls = mockLogger.getCallsOfLevel('warn');
      const errorCalls = mockLogger.getCallsOfLevel('error');
      const debugCalls = mockLogger.getCallsOfLevel('debug');
      
      expect(infoCalls).toHaveLength(1);
      expect(warnCalls).toHaveLength(1);
      expect(errorCalls).toHaveLength(1);
      expect(debugCalls).toHaveLength(1);
      
      expect(infoCalls[0].message).toBe('Info message');
      expect(warnCalls[0].message).toBe('Warn message');
      expect(errorCalls[0].message).toBe('Error message');
      expect(debugCalls[0].message).toBe('Debug message');
    });

    it('should check if specific message was logged', () => {
      expect(mockLogger.hasMessage('Info message')).toBe(true);
      expect(mockLogger.hasMessage('Warn message')).toBe(true);
      expect(mockLogger.hasMessage('Nonexistent message')).toBe(false);
    });

    it('should check if specific context was logged', () => {
      expect(mockLogger.hasContext({ module: 'test' })).toBe(true);
      expect(mockLogger.hasContext({ trace: 'debug' })).toBe(true);
      expect(mockLogger.hasContext({ nonexistent: 'value' })).toBe(false);
    });

    it('should handle partial context matching', () => {
      mockLogger.clear();
      mockLogger.info({ module: 'test', requestId: '123', extra: 'data' }, 'Test message');
      
      // Should match partial context
      expect(mockLogger.hasContext({ module: 'test' })).toBe(true);
      expect(mockLogger.hasContext({ requestId: '123' })).toBe(true);
      expect(mockLogger.hasContext({ module: 'test', requestId: '123' })).toBe(true);
      
      // Should not match if any key doesn't match
      expect(mockLogger.hasContext({ module: 'wrong' })).toBe(false);
      expect(mockLogger.hasContext({ module: 'test', wrong: 'value' })).toBe(false);
    });
  });

  describe('child logger', () => {
    it('should create child logger instance', () => {
      const childLogger = mockLogger.child({ module: 'child' });
      
      expect(childLogger).toBeDefined();
      expect(childLogger).toBeInstanceOf(MockLoggerServiceImpl);
      expect(typeof childLogger.info).toBe('function');
    });

    it('should create independent child logger', () => {
      const childLogger = mockLogger.child({ module: 'child' });
      
      mockLogger.info('Parent message');
      childLogger.info('Child message');
      
      expect(mockLogger.calls).toHaveLength(1);
      expect(mockLogger.calls[0].message).toBe('Parent message');
      
      // Child logger has its own call history
      expect((childLogger as MockLoggerServiceImpl).calls).toHaveLength(1);
      expect((childLogger as MockLoggerServiceImpl).calls[0].message).toBe('Child message');
    });
  });

  describe('edge cases', () => {
    it('should handle empty message', () => {
      mockLogger.info({ context: 'test' }, '');
      
      expect(mockLogger.calls).toHaveLength(1);
      expect(mockLogger.calls[0].message).toBe('');
    });

    it('should handle undefined message in context call', () => {
      mockLogger.info({ context: 'test' }, undefined as unknown as string);
      
      expect(mockLogger.calls).toHaveLength(1);
      expect(mockLogger.calls[0].message).toBe('');
    });

    it('should handle context with null values', () => {
      const context = { nullValue: null, undefinedValue: undefined };
      mockLogger.info(context, 'Test message');
      
      expect(mockLogger.calls).toHaveLength(1);
      expect(mockLogger.calls[0].context).toEqual(context);
    });
  });
});
