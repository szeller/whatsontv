import { jest } from '@jest/globals';
import type { Arguments } from 'yargs';

import type { CliArgs as CliArguments } from '../../types/cliArgs.js';
import { getTodayDate } from '../../utils/dateUtils.js';

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
  handler?: (arguments_: Arguments) => void | Promise<void>;
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
const defaultArguments: CliArguments & Record<string, unknown> = {
  date: getTodayDate(),
  country: 'US',
  types: [],
  networks: [],
  genres: [],
  languages: [],
  query: '',
  slack: false,
  help: false,
  debug: false,
  fetch: 'all',
  limit: 10,
  time: false,
  groupByNetwork: true,
  minAirtime: '18:00',
  _: [],
  $0: 'whatsontv'
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
  const commandHandlers: Record<string, (arguments_: Arguments) => void | Promise<void>> = {};

  // Mock command implementation
  mockCommand.mockImplementation((command_: unknown): MockYargsInstance => {
    if (typeof command_ === 'string' || isYargsCommand(command_)) {
      if (isYargsCommand(command_)) {
        const { command, builder, handler } = command_;
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
  mockParse.mockImplementation((arguments_: unknown): Record<string, unknown> => {
    if (!isStringArray(arguments_)) {
      throw new TypeError('Parse expects string array argument');
    }

    const parsedArguments: Record<string, unknown> = { ...defaultArguments };
    parseArguments(arguments_, currentOptions, parsedArguments);
    applyDefaults(currentOptions, parsedArguments);

    return parsedArguments;
  });

  // Mock options implementation
  mockOptions.mockImplementation((options: unknown): MockYargsInstance => {
    if (!isOptionsObject(options)) {
      throw new TypeError('Options expects options object argument');
    }
    currentOptions = { ...currentOptions, ...options };
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

/** Set a parsed value and its alias if present */
function setWithAlias(
  parsedArguments: Record<string, unknown>,
  key: string, value: unknown,
  option: YargsOptions
): void {
  parsedArguments[key] = value;
  if (option.alias !== undefined && option.alias !== '') {
    parsedArguments[option.alias] = value;
  }
}

/** Parse a non-boolean argument, returning how many args were consumed */
function parseValueArgument(
  arguments_: string[], index: number,
  key: string, option: YargsOptions,
  parsedArguments: Record<string, unknown>
): number {
  const value: string = arguments_[index + 1];
  if (option.type === 'array' && value !== '') {
    setWithAlias(parsedArguments, key, [value], option);
    return 1;
  }
  if (value !== '' && !value.startsWith('--')) {
    setWithAlias(parsedArguments, key, value, option);
    return 1;
  }
  return 0;
}

/** Parse CLI args into parsedArgs using the registered options */
function parseArguments(
  arguments_: string[],
  options: Record<string, YargsOptions>,
  parsedArguments: Record<string, unknown>
): void {
  for (let index = 0; index < arguments_.length; index++) {
    const argument: string = arguments_[index];
    if (!argument.startsWith('--')) {
      continue;
    }
    const key: string = argument.slice(2);
    const option = options[key];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (option === undefined) {
      continue;
    }
    if (option.type === 'boolean') {
      setWithAlias(parsedArguments, key, true, option);
    } else {
      index += parseValueArgument(arguments_, index, key, option, parsedArguments);
    }
  }
}

/** Apply default values for any options not yet set */
function applyDefaults(
  options: Record<string, YargsOptions>,
  parsedArguments: Record<string, unknown>
): void {
  for (const [key, option] of Object.entries(options)) {
    if (option.default !== undefined && parsedArguments[key] === undefined) {
      setWithAlias(parsedArguments, key, option.default, option);
    }
  }
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
