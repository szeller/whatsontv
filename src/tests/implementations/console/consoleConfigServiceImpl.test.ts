/**
 * Tests for ConsoleConfigServiceImpl
 */
import { 
  describe, 
  it, 
  expect,
  jest,
  beforeEach,
  afterEach
} from '@jest/globals';
import type { SpyInstance } from 'jest-mock';
import type { Argv } from 'yargs';

// Import the implementation class
import { 
  ConsoleConfigServiceImpl 
} from '../../../implementations/console/consoleConfigServiceImpl.js';
import type { CliArgs } from '../../../types/cliArgs.js';
import type { AppConfig } from '../../../types/configTypes.js';
import { getTodayDate } from '../../../utils/dateUtils.js';

// Create a test subclass that extends the implementation
class TestConsoleConfigService extends ConsoleConfigServiceImpl {
  // Mock data for tests
  private mockFileExists = false;
  private mockFileContents = '{}';
  private mockConfigPath = '/mock/path/config.json';
  private mockCliArgs: Partial<CliArgs> = {
    date: getTodayDate(),
    help: false,
    debug: false,
    fetch: 'network'
  };

  constructor(options: {
    cliArgs?: Partial<CliArgs>;
    fileExists?: boolean;
    fileContents?: string;
  } = {}) {
    // Skip initialization in the parent constructor
    super(true);
    
    // Set mock values before manually initializing
    if (options.cliArgs) {
      this.mockCliArgs = { ...this.mockCliArgs, ...options.cliArgs };
    }
    
    if (options.fileExists !== undefined) {
      this.mockFileExists = options.fileExists;
    }
    
    if (options.fileContents !== undefined) {
      this.mockFileContents = options.fileContents;
    }
    
    // Now manually initialize with our mock values in place
    this.initialize();
  }

  // Allow direct access to protected methods for testing
  public getDefaultConfigForTest(): AppConfig {
    return this.getDefaultConfig();
  }

  public getConfigFilePathForTest(): string {
    return this.getConfigFilePath();
  }

  public parseArgsForTest(args?: string[]): CliArgs {
    return this.parseArgs(args);
  }

  public createYargsInstanceForTest(args: string[]): Argv {
    return this.createYargsInstance(args);
  }

  public loadConfigForTest(): AppConfig {
    return this.loadConfig();
  }

  // Override protected methods
  protected override parseArgs(args?: string[]): CliArgs {
    if (args) {
      // If args are provided, call the parent method
      return super.parseArgs(args);
    }
    // Otherwise return our mock CLI args
    return this.mockCliArgs as CliArgs;
  }

  protected override getConfigFilePath(): string {
    return this.mockConfigPath;
  }

  protected override fileExists(_filePath: string): boolean {
    return this.mockFileExists;
  }

  protected override readFile(_filePath: string): string {
    return this.mockFileContents;
  }

  protected override parseConfigFile(fileContents: string): Partial<AppConfig> {
    try {
      return JSON.parse(fileContents) as Partial<AppConfig>;
    } catch (error) {
      // Log warning for invalid JSON (matching the parent implementation)
      console.warn(`Warning: Could not load config.json: ${(error as Error).message}`);
      // Return empty object for invalid JSON
      return {};
    }
  }
}

describe('ConsoleConfigServiceImpl', () => {
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
    }
  };

  // Mock console.warn
  let consoleWarnSpy: SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should use default config when no config file exists', () => {
    // Act
    const configService = new TestConsoleConfigService({
      fileExists: false
    });
    
    // Assert
    expect(configService.getShowOptions().country).toBe(defaultConfig.country);
  });

  it('should load config from file when it exists', () => {
    // Arrange
    const mockConfig = {
      country: 'CA'
    };
    
    // Act
    const configService = new TestConsoleConfigService({
      fileExists: true,
      fileContents: JSON.stringify(mockConfig)
    });
    
    // Assert
    expect(configService.getShowOptions().country).toBe(mockConfig.country);
  });

  it('should prioritize CLI arguments over config file values', () => {
    // Arrange
    const cliArgs: Partial<CliArgs> = {
      country: 'UK',
      types: ['drama'],
      networks: ['BBC']
    };
    
    const mockConfig = {
      country: 'CA',
      types: ['comedy'],
      networks: ['CBC']
    };
    
    // Act
    const configService = new TestConsoleConfigService({
      cliArgs,
      fileExists: true,
      fileContents: JSON.stringify(mockConfig)
    });
    
    // Assert
    const showOptions = configService.getShowOptions();
    expect(showOptions.country).toBe(cliArgs.country);
    expect(showOptions.types).toEqual(cliArgs.types);
    expect(showOptions.networks).toEqual(cliArgs.networks);
  });

  it('should correctly use filter arrays from config file when no CLI arguments provided', () => {
    // Arrange
    const mockConfig = {
      country: 'CA',
      types: ['comedy', 'drama'],
      networks: ['CBC', 'Netflix'],
      genres: ['action', 'thriller']
    };
    
    // Act
    const configService = new TestConsoleConfigService({
      fileExists: true,
      fileContents: JSON.stringify(mockConfig)
    });
    
    // Assert
    const showOptions = configService.getShowOptions();
    expect(showOptions.country).toBe(mockConfig.country);
    expect(showOptions.types).toEqual(mockConfig.types);
    expect(showOptions.networks).toEqual(mockConfig.networks);
    expect(showOptions.genres).toEqual(mockConfig.genres);
  });

  it('should correctly merge empty CLI filter arrays with config file arrays', () => {
    // Arrange
    const cliArgs: Partial<CliArgs> = {
      country: 'UK',
      // Empty arrays should not override config values
      types: [],
      networks: [],
      genres: []
    };
    
    const mockConfig = {
      country: 'CA',
      types: ['comedy', 'drama'],
      networks: ['CBC', 'Netflix'],
      genres: ['action', 'thriller']
    };
    
    // Act
    const configService = new TestConsoleConfigService({
      cliArgs,
      fileExists: true,
      fileContents: JSON.stringify(mockConfig)
    });
    
    // Assert
    const showOptions = configService.getShowOptions();
    expect(showOptions.country).toBe(cliArgs.country); // Country should be overridden
    // Filter arrays should use config values when CLI arrays are empty
    expect(showOptions.types).toEqual(mockConfig.types);
    expect(showOptions.networks).toEqual(mockConfig.networks);
    expect(showOptions.genres).toEqual(mockConfig.genres);
  });

  it('should handle empty CLI arguments', () => {
    // Arrange
    const mockConfig = {
      country: 'CA',
      types: ['comedy'],
      networks: ['CBC']
    };
    
    // Act
    const configService = new TestConsoleConfigService({
      fileExists: true,
      fileContents: JSON.stringify(mockConfig)
    });
    
    // Assert
    const showOptions = configService.getShowOptions();
    expect(showOptions.country).toBe(mockConfig.country);
    expect(showOptions.types).toEqual(mockConfig.types);
    expect(showOptions.networks).toEqual(mockConfig.networks);
  });

  it('should handle invalid JSON in config file', () => {
    // Arrange
    const invalidJson = 'invalid json';
    
    // Act
    const configService = new TestConsoleConfigService({
      fileExists: true,
      fileContents: invalidJson
    });
    
    // Assert
    expect(configService.getShowOptions().country).toBe(defaultConfig.country);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Warning: Could not load config.json')
    );
  });

  it('should correctly get specific show option', () => {
    // Arrange
    const cliArgs: Partial<CliArgs> = {
      country: 'UK',
      types: ['drama'],
      networks: ['BBC']
    };
    
    // Act
    const configService = new TestConsoleConfigService({
      cliArgs
    });
    
    // Assert
    expect(configService.getShowOption('country')).toBe(cliArgs.country);
    expect(configService.getShowOption('types')).toEqual(cliArgs.types);
    expect(configService.getShowOption('networks')).toEqual(cliArgs.networks);
  });

  it('should correctly get CLI options', () => {
    // Arrange
    const cliArgs: Partial<CliArgs> = {
      debug: true
    };
    
    // Act
    const configService = new TestConsoleConfigService({
      cliArgs
    });
    
    // Assert
    const cliOptions = configService.getCliOptions();
    expect(cliOptions.debug).toBe(true);
  });

  it('should correctly get the complete config', () => {
    // Arrange
    const mockConfig = {
      country: 'CA'
    };
    
    // Act
    const configService = new TestConsoleConfigService({
      fileExists: true,
      fileContents: JSON.stringify(mockConfig)
    });
    
    // Assert
    const config = configService.getConfig();
    expect(config.country).toBe(mockConfig.country);
  });

  it('should correctly parse command line arguments', () => {
    // Create a service instance with direct access to protected methods
    const configService = new TestConsoleConfigService();
    
    // Test parsing arguments
    const args = [
      '--date', '2023-01-01',
      '--country', 'UK',
      '--types', 'drama,comedy',
      '--networks', 'BBC,ITV',
      '--debug'
    ];
    
    const parsedArgs = configService.parseArgsForTest(args);
    
    expect(parsedArgs.date).toBe('2023-01-01');
    expect(parsedArgs.country).toBe('UK');
    expect(parsedArgs.types).toEqual(['drama', 'comedy']);
    expect(parsedArgs.networks).toEqual(['BBC', 'ITV']);
    expect(parsedArgs.debug).toBe(true);
  });

  it('should handle fetch source parameter', () => {
    // Arrange
    const cliArgs: Partial<CliArgs> = {
      fetch: 'web'
    };
    
    // Act
    const configService = new TestConsoleConfigService({
      cliArgs
    });
    
    // Assert
    const showOptions = configService.getShowOptions();
    expect(showOptions.fetchSource).toBe('web');
  });

  it('should merge slack config correctly', () => {
    // Arrange
    const mockConfig = {
      slack: {
        enabled: true,
        botToken: 'test-token',
        channel: 'test-channel'
      }
    };
    
    // Act
    const configService = new TestConsoleConfigService({
      fileExists: true,
      fileContents: JSON.stringify(mockConfig)
    });
    
    // Assert
    const config = configService.getConfig();
    expect(config.slack.enabled).toBe(true);
    expect(config.slack.botToken).toBe('test-token');
    expect(config.slack.channel).toBe('test-channel');
  });

  it('should handle empty config file', () => {
    // Act
    const configService = new TestConsoleConfigService({
      fileExists: true,
      fileContents: '{}'
    });
    
    // Assert
    expect(configService.getShowOptions().country).toBe(defaultConfig.country);
  });

  it('should correctly create a yargs instance with all options', () => {
    // Create a service instance with direct access to protected methods
    const configService = new TestConsoleConfigService();
    
    // Create a yargs instance
    const yargsInstance = configService.createYargsInstanceForTest([]);
    
    // Since we can't directly access yargs options in a type-safe way,
    // we'll just verify the instance was created without errors
    expect(yargsInstance).toBeDefined();
  });
});
