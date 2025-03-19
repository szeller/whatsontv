import fs from 'fs';
import path from 'path';

import { jest, describe, it, expect } from '@jest/globals';

import type { Config } from '../types/config.js';

// Mock fs module functions
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));

// Mock path.join
jest.mock('path', () => ({
  ...jest.requireActual<typeof path>('path'),
  join: jest.fn()
}));

describe('config', () => {
  const mockConfigPath = '/mock/path/config.json';
  const defaultConfig: Config = {
    country: 'US',
    types: [],
    networks: [],
    genres: [],
    languages: ['English'],
    notificationTime: '9:00',
    slack: {
      enabled: true,
      botToken: undefined,
      channel: undefined
    }
  };

  beforeEach((): void => {
    // Clear module cache
    jest.resetModules();

    // Reset mocks
    const mockExistsSync = jest.spyOn(fs, 'existsSync');
    const mockReadFileSync = jest.spyOn(fs, 'readFileSync');
    const mockJoin = jest.spyOn(path, 'join');

    mockJoin.mockReturnValue(mockConfigPath);
    mockExistsSync.mockReturnValue(false);
    mockReadFileSync.mockReset();

    // Reset console mock
    jest.spyOn(console, 'warn').mockImplementation(jest.fn());
  });

  afterEach((): void => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should load default config when no config file exists', async (): Promise<void> => {
    const { default: config } = await import('../config.js');
    expect(config).toEqual(defaultConfig);
    expect(fs.readFileSync).not.toHaveBeenCalled();
  });

  it('should merge user config with default config', async (): Promise<void> => {
    const userConfig: Partial<Config> = {
      country: 'GB',
      types: ['Reality'],
      networks: ['BBC'],
      slack: {
        enabled: false,
        channel: '#tv-shows'
      }
    };

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(userConfig));

    const { default: config } = await import('../config.js');
    expect(config).toEqual({
      ...defaultConfig,
      ...userConfig,
      slack: {
        ...defaultConfig.slack,
        ...userConfig.slack
      }
    });
  });

  it('should handle invalid JSON in config file', async (): Promise<void> => {
    const mockWarn = jest.fn();
    jest.spyOn(console, 'warn').mockImplementation(mockWarn);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue('invalid json');

    const { default: config } = await import('../config.js');

    const expectedError = 'Warning: Could not load config.json: ' + 
      'Unexpected token \'i\', "invalid json" is not valid JSON';
    expect(mockWarn).toHaveBeenCalledWith(expectedError);
    expect(config).toEqual(defaultConfig);
  });

  it('should handle file system errors', async (): Promise<void> => {
    const mockWarn = jest.fn();
    jest.spyOn(console, 'warn').mockImplementation(mockWarn);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('Permission denied');
    });

    const { default: config } = await import('../config.js');
    expect(mockWarn).toHaveBeenCalledWith('Warning: Could not load config.json: Permission denied');
    expect(config).toEqual(defaultConfig);
  });
});
