import { jest } from '@jest/globals';
import type { Arguments } from 'yargs';

import type { CliArgs } from '../../types/cliArgs.js';
import { getTodayDate } from '../../utils/showUtils.js';

interface YargsOptions {
  alias?: string;
  default?: unknown;
  type?: 'string' | 'boolean' | 'number' | 'array';
  description?: string;
}

interface YargsCommand {
  command: string;
  describe?: string;
  builder?: Record<string, YargsOptions>;
  handler?: (args: Arguments) => void | Promise<void>;
}

export interface MockYargsInstance {
  command: jest.Mock;
  parse: jest.Mock;
  options: jest.Mock;
  help: jest.Mock;
  exit: jest.Mock;
  argv: Record<string, unknown>;
}

// Only include properties that exist in the CliArgs interface
const defaultArgs: CliArgs & Record<string, unknown> = {
  date: getTodayDate(),
  country: 'US',
  types: [],
  networks: [],
  genres: [],
  languages: [],
  timeSort: false,
  query: '',
  slack: false,
  help: false,
  version: false,
  debug: false,
  limit: 10,
  time: false,
  // Include these as extra properties for the tests
  _: [],
  $0: 'test'
};

/**
 * Type guard to check if a value is a YargsCommand
 * @param cmd Value to check
 * @returns True if value is a YargsCommand
 */
function isYargsCommand(cmd: unknown): cmd is YargsCommand {
  return typeof cmd === 'object' && cmd !== null && 'command' in cmd;
}

/**
 * Type guard to check if a value is a string array
 * @param value Value to check
 * @returns True if value is string[]
 */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item: unknown): boolean => typeof item === 'string');
}

/**
 * Type guard to check if a value is a YargsOptions object
 * @param value Value to check
 * @returns True if value is Record<string, YargsOptions>
 */
function isOptionsObject(value: unknown): value is Record<string, YargsOptions> {
  return typeof value === 'object' && value !== null;
}

/**
 * Create a mock Yargs instance for testing
 * @returns Mock Yargs instance with test implementations
 */
export function createMockYargs(): MockYargsInstance {
  const mockCommand: jest.Mock = jest.fn();
  const mockParse: jest.Mock = jest.fn();
  const mockOptions: jest.Mock = jest.fn();
  const mockHelp: jest.Mock = jest.fn();
  const mockExit: jest.Mock = jest.fn();
  let currentOptions: Record<string, YargsOptions> = {};

  const mockYargs: MockYargsInstance = {
    command: mockCommand,
    parse: mockParse,
    options: mockOptions,
    help: mockHelp,
    exit: mockExit,
    argv: {}
  };

  // Store command handlers
  const commandHandlers: Record<string, (args: Arguments) => void | Promise<void>> = {};

  // Mock command implementation
  mockCommand.mockImplementation((cmd: unknown): MockYargsInstance => {
    if (typeof cmd === 'string' || isYargsCommand(cmd)) {
      if (isYargsCommand(cmd)) {
        const { command, builder, handler } = cmd;
        if (builder) {
          currentOptions = { ...currentOptions, ...builder };
        }
        if (handler) {
          commandHandlers[command] = handler;
        }
      }
      return mockYargs;
    }
    throw new TypeError('Invalid command argument');
  });

  // Mock parse implementation
  mockParse.mockImplementation((args: unknown): Record<string, unknown> => {
    if (!isStringArray(args)) {
      throw new TypeError('Parse expects string array argument');
    }

    const parsedArgs: Record<string, unknown> = { ...defaultArgs };

    for (let i = 0; i < args.length; i++) {
      const arg: string = args[i];
      if (arg.startsWith('--')) {
        const key: string = arg.slice(2);
        const option: YargsOptions | undefined = currentOptions[key];
        if (option !== undefined && option !== null) {
          if (option.type === 'boolean') {
            parsedArgs[key] = true;
            if (option.alias !== undefined && option.alias !== '') {
              parsedArgs[option.alias] = true;
            }
          } else {
            const value: string | undefined = args[i + 1];
            if (option.type === 'array' && value !== undefined && value !== '') {
              parsedArgs[key] = [value];
              if (option.alias !== undefined && option.alias !== '') {
                parsedArgs[option.alias] = [value];
              }
              i++;
            } else if (value !== undefined && value !== '' && !value.startsWith('--')) {
              parsedArgs[key] = value;
              if (option.alias !== undefined && option.alias !== '') {
                parsedArgs[option.alias] = value;
              }
              i++;
            }
          }
        }
      }
    }

    Object.entries(currentOptions).forEach(([key, option]: [string, YargsOptions]): void => {
      if (option.default !== undefined && parsedArgs[key] === undefined) {
        parsedArgs[key] = option.default;
        if (option.alias !== undefined && option.alias !== '') {
          parsedArgs[option.alias] = option.default;
        }
      }
    });

    return parsedArgs;
  });

  // Mock options implementation
  mockOptions.mockImplementation((opts: unknown): MockYargsInstance => {
    if (!isOptionsObject(opts)) {
      throw new TypeError('Options expects options object argument');
    }
    currentOptions = { ...currentOptions, ...opts };
    return mockYargs;
  });

  // Mock help implementation
  mockHelp.mockImplementation((): MockYargsInstance => mockYargs);

  // Mock exit implementation
  mockExit.mockImplementation((code: unknown): void => {
    if (typeof code !== 'number') {
      throw new TypeError('Exit expects number argument');
    }
    process.exitCode = code;
  });

  return mockYargs;
}

/**
 * Mock the yargs module for testing
 * @param yargs Mock Yargs instance to use
 */
export function mockYargs(yargs: MockYargsInstance): void {
  jest.mock('yargs', () => ({
    __esModule: true,
    default: () => yargs
  }));
}
