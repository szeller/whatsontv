import { jest } from '@jest/globals';

import { createMockYargs, mockYargs, type MockYargsInstance } from './yargsHelper.js';

describe('yargsHelper', () => {
  describe('createMockYargs', () => {
    let mockYargsInstance: MockYargsInstance;

    beforeEach(() => {
      mockYargsInstance = createMockYargs();
    });

    test('returns a mock yargs instance with expected methods', () => {
      expect(mockYargsInstance).toHaveProperty('command');
      expect(mockYargsInstance).toHaveProperty('parse');
      expect(mockYargsInstance).toHaveProperty('options');
      expect(mockYargsInstance).toHaveProperty('help');
      expect(mockYargsInstance).toHaveProperty('exit');
      expect(mockYargsInstance).toHaveProperty('argv');
    });

    describe('command method', () => {
      test('handles string commands', () => {
        const result = mockYargsInstance.command('test');
        expect(result).toBe(mockYargsInstance);
        expect(mockYargsInstance.command).toHaveBeenCalledWith('test');
      });

      test('handles command objects with builder and handler', () => {
        const handler = jest.fn();
        const builder = {
          test: {
            type: 'string' as const,
            description: 'Test option'
          }
        };

        const result = mockYargsInstance.command({
          command: 'test',
          describe: 'Test command',
          builder,
          handler
        });

        expect(result).toBe(mockYargsInstance);
      });

      test('throws error for invalid command argument', () => {
        expect(() => {
          mockYargsInstance.command(123 as unknown);
        }).toThrow(TypeError);
        expect(() => {
          mockYargsInstance.command(123 as unknown);
        }).toThrow('Invalid command argument');
      });
    });

    describe('parse method', () => {
      test('parses string array arguments', () => {
        mockYargsInstance.options({
          test: {
            type: 'string' as const,
            default: 'default'
          }
        });

        const result = mockYargsInstance.parse(['--test', 'value']) as Record<string, unknown>;
        expect(result).toHaveProperty('test', 'value');
      });

      test('handles boolean options', () => {
        mockYargsInstance.options({
          flag: {
            type: 'boolean' as const,
            alias: 'f'
          }
        });

        const result = mockYargsInstance.parse(['--flag']) as Record<string, unknown>;
        expect(result).toHaveProperty('flag', true);
        expect(result).toHaveProperty('f', true);
      });

      test('handles array options', () => {
        mockYargsInstance.options({
          list: {
            type: 'array' as const,
            alias: 'l'
          }
        });

        const result = mockYargsInstance.parse(['--list', 'item']) as Record<string, unknown>;
        expect(result).toHaveProperty('list');
        expect(Array.isArray(result.list)).toBe(true);
        expect(result.list).toEqual(['item']);
        expect(result).toHaveProperty('l');
        expect(Array.isArray(result.l)).toBe(true);
        expect(result.l).toEqual(['item']);
      });

      test('applies default values when not provided', () => {
        mockYargsInstance.options({
          option: {
            type: 'string' as const,
            default: 'default-value',
            alias: 'o'
          }
        });

        const result = mockYargsInstance.parse([]) as Record<string, unknown>;
        expect(result).toHaveProperty('option', 'default-value');
        expect(result).toHaveProperty('o', 'default-value');
      });

      test('throws error for non-array arguments', () => {
        expect(() => {
          mockYargsInstance.parse(123 as unknown);
        }).toThrow(TypeError);
        expect(() => {
          mockYargsInstance.parse(123 as unknown);
        }).toThrow('Parse expects string array argument');
      });
    });

    describe('options method', () => {
      test('adds options to the yargs instance', () => {
        const options = {
          test: {
            type: 'string' as const,
            description: 'Test option'
          }
        };

        const result = mockYargsInstance.options(options);
        expect(result).toBe(mockYargsInstance);
        expect(mockYargsInstance.options).toHaveBeenCalledWith(options);
      });

      test('throws error for invalid options argument', () => {
        expect(() => {
          mockYargsInstance.options('invalid' as unknown);
        }).toThrow(TypeError);
        expect(() => {
          mockYargsInstance.options('invalid' as unknown);
        }).toThrow('Options expects options object argument');
      });
    });

    describe('help method', () => {
      test('returns the yargs instance', () => {
        const result = mockYargsInstance.help();
        expect(result).toBe(mockYargsInstance);
      });
    });

    describe('exit method', () => {
      test('sets process.exitCode to the provided code', () => {
        const originalExitCode = process.exitCode;
        mockYargsInstance.exit(1);
        expect(process.exitCode).toBe(1);
        
        // Restore original exitCode
        process.exitCode = originalExitCode;
      });

      test('throws error for non-number argument', () => {
        expect(() => {
          mockYargsInstance.exit('invalid' as unknown);
        }).toThrow(TypeError);
        expect(() => {
          mockYargsInstance.exit('invalid' as unknown);
        }).toThrow('Exit expects number argument');
      });
    });
  });

  describe('mockYargs', () => {
    test('mocks the yargs module', () => {
      const mockYargsInstance = createMockYargs();
      
      // We can't directly test the jest.mock implementation,
      // but we can verify the function doesn't throw
      expect(() => {
        mockYargs(mockYargsInstance);
      }).not.toThrow();
    });
  });
});
