/**
 * Tests for ConsoleConfigServiceImpl
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { 
  jest, 
  describe, 
  it, 
  expect, 
  beforeEach 
} from '@jest/globals';

import { 
  ConsoleConfigServiceImpl 
} from '../../../implementations/console/consoleConfigServiceImpl.js';
import type { CliArgs } from '../../../types/cliArgs.js';
import type { AppConfig } from '../../../types/configTypes.js';

// Mock fs module functions
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));

// Mock path.resolve
jest.mock('path', () => ({
  ...jest.requireActual<typeof path>('path'),
  resolve: jest.fn(),
  dirname: jest.fn()
}));

// Mock fileURLToPath
jest.mock('url', () => ({
  ...jest.requireActual<typeof URL>('url'),
  fileURLToPath: jest.fn()
}));

describe('ConsoleConfigServiceImpl', () => {
  const mockConfigPath = '/mock/path/config.json';
  const defaultConfig: AppConfig = {
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
    },
    appName: 'WhatsOnTV',
    version: '1.0.0',
    apiUrl: 'https://api.tvmaze.com'
  };

  beforeEach((): void => {
    // Reset mocks
    jest.resetAllMocks();
    
    // Setup path mocks
    (fileURLToPath as jest.Mock).mockReturnValue('/mock/path/file.js');
    (path.dirname as jest.Mock).mockReturnValue('/mock/path');
    (path.resolve as jest.Mock).mockReturnValue(mockConfigPath);
    
    // Setup fs mocks
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReturnValue('{}');
  });

  it('should use default config when no config file exists', () => {
    // Arrange
    const cliArgs: Partial<CliArgs> = {};
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    // Act
    const configService = new ConsoleConfigServiceImpl(cliArgs as CliArgs);
    
    // Assert
    expect(configService.getAppName()).toBe(defaultConfig.appName);
    expect(configService.getVersion()).toBe(defaultConfig.version);
    expect(configService.getApiUrl()).toBe(defaultConfig.apiUrl);
    expect(configService.getShowOptions().country).toBe(defaultConfig.country);
  });

  it('should load config from file when it exists', () => {
    // Arrange
    const cliArgs: Partial<CliArgs> = {};
    const mockConfig = {
      country: 'CA',
      appName: 'CustomTVApp',
      version: '2.0.0'
    };
    
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));
    
    // Act
    const configService = new ConsoleConfigServiceImpl(cliArgs as CliArgs);
    
    // Assert
    expect(configService.getAppName()).toBe(mockConfig.appName);
    expect(configService.getVersion()).toBe(mockConfig.version);
    expect(configService.getShowOptions().country).toBe(mockConfig.country);
  });

  it('should prioritize CLI arguments over config file values', () => {
    // Arrange
    const cliArgs: Partial<CliArgs> = {
      country: 'UK',
      types: ['Scripted'],
      networks: ['BBC'],
      genres: ['Drama']
    };
    
    const mockConfig = {
      country: 'CA',
      types: ['Reality'],
      networks: ['CBC'],
      genres: ['Comedy']
    };
    
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));
    
    // Act
    const configService = new ConsoleConfigServiceImpl(cliArgs as CliArgs);
    const showOptions = configService.getShowOptions();
    
    // Assert
    expect(showOptions.country).toBe(cliArgs.country);
    expect(showOptions.types).toEqual(cliArgs.types);
    expect(showOptions.networks).toEqual(cliArgs.networks);
    expect(showOptions.genres).toEqual(cliArgs.genres);
  });

  it('should handle errors when loading config file', () => {
    // Arrange
    const cliArgs: Partial<CliArgs> = {};
    
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('File read error');
    });
    
    // Mock console.warn to prevent test output pollution
    const originalWarn = console.warn;
    console.warn = jest.fn();
    
    // Act
    const configService = new ConsoleConfigServiceImpl(cliArgs as CliArgs);
    
    // Assert
    expect(configService.getAppName()).toBe(defaultConfig.appName); // Should use default
    expect(console.warn).toHaveBeenCalled();
    
    // Restore console.warn
    console.warn = originalWarn;
  });

  it('should correctly merge slack config', () => {
    // Arrange
    const cliArgs: Partial<CliArgs> = {};
    const mockConfig = {
      slack: {
        enabled: false,
        channel: 'test-channel'
      }
    };
    
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));
    
    // Act
    const configService = new ConsoleConfigServiceImpl(cliArgs as CliArgs);
    const config = configService.getConfig();
    
    // Assert
    expect(config.slack.enabled).toBe(mockConfig.slack.enabled);
    expect(config.slack.channel).toBe(mockConfig.slack.channel);
    expect(config.slack.botToken).toBe(process.env.SLACK_BOT_TOKEN);
  });

  it('should return CLI options', () => {
    // Arrange
    const cliArgs: Partial<CliArgs> = {
      debug: true,
      timeSort: true,
      limit: 10
    };
    
    // Act
    const configService = new ConsoleConfigServiceImpl(cliArgs as CliArgs);
    const cliOptions = configService.getCliOptions();
    
    // Assert
    expect(cliOptions.debug).toBe(cliArgs.debug);
    expect(cliOptions.timeSort).toBe(cliArgs.timeSort);
    expect(cliOptions.limit).toBe(cliArgs.limit);
    expect(cliOptions.slack).toBe(false); // Default
  });

  it('should get specific show option', () => {
    // Arrange
    const cliArgs: Partial<CliArgs> = {
      country: 'DE',
      languages: ['German']
    };
    
    // Act
    const configService = new ConsoleConfigServiceImpl(cliArgs as CliArgs);
    
    // Assert
    expect(configService.getShowOption('country')).toBe(cliArgs.country);
    expect(configService.getShowOption('languages')).toEqual(cliArgs.languages);
  });
});
