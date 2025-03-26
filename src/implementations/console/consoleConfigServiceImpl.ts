/**
 * Implementation of ConfigService that combines CLI arguments and config file
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { injectable } from 'tsyringe';
import yargs from 'yargs';

import type { ConfigService } from '../../interfaces/configService.js';
import type { ShowOptions } from '../../types/tvShowOptions.js';
import type { CliOptions, AppConfig } from '../../types/configTypes.js';
import type { CliArgs } from '../../types/cliArgs.js';
import { getTodayDate } from '../../utils/dateUtils.js';

@injectable()
export class ConsoleConfigServiceImpl implements ConfigService {
  protected showOptions!: ShowOptions;
  protected cliOptions!: CliOptions;
  protected appConfig!: AppConfig;
  protected cliArgs!: CliArgs;
  
  /**
   * Create a new ConsoleConfigServiceImpl
   * @param skipInitialization Optional flag to skip initialization (for testing)
   */
  constructor(skipInitialization = false) {
    if (!skipInitialization) {
      this.initialize();
    }
  }
  
  /**
   * Initialize the service
   * This method is separated from the constructor to allow overriding in tests
   * @protected
   */
  protected initialize(): void {
    // Parse command line arguments
    this.cliArgs = this.parseArgs();
    
    // Load and merge configurations
    this.appConfig = this.loadConfig();
    
    // Extract show options
    this.showOptions = {
      date: this.cliArgs.date ?? getTodayDate(),
      country: this.cliArgs.country ?? this.appConfig.country,
      types: this.cliArgs.types ?? this.appConfig.types,
      networks: this.cliArgs.networks ?? this.appConfig.networks,
      genres: this.cliArgs.genres ?? this.appConfig.genres,
      languages: this.cliArgs.languages ?? this.appConfig.languages,
      webOnly: this.cliArgs.webOnly ?? false,
      showAll: this.cliArgs.showAll ?? false
    };
    
    // Extract CLI options
    this.cliOptions = {
      debug: this.cliArgs.debug ?? false,
      timeSort: this.cliArgs.timeSort ?? false,
      slack: this.cliArgs.slack ?? false,
      help: this.cliArgs.help ?? false,
      version: this.cliArgs.version ?? false,
      limit: this.cliArgs.limit ?? 0
    };
  }
  
  /**
   * Get the complete show options configuration
   * @returns Configuration options for fetching and displaying shows
   */
  getShowOptions(): ShowOptions {
    return { ...this.showOptions };
  }
  
  /**
   * Get a specific show option value
   * @param key Show option key
   * @returns Value for the specified key
   */
  getShowOption<K extends keyof ShowOptions>(key: K): ShowOptions[K] {
    return this.showOptions[key];
  }
  
  /**
   * Get CLI-specific flags and options
   * @returns CLI-specific configuration options
   */
  getCliOptions(): CliOptions {
    return { ...this.cliOptions };
  }
  
  /**
   * Get application name
   * @returns Application name
   */
  getAppName(): string {
    return this.appConfig.appName;
  }
  
  /**
   * Get application version
   * @returns Application version
   */
  getVersion(): string {
    return this.appConfig.version;
  }
  
  /**
   * Get API base URL
   * @returns API base URL
   */
  getApiUrl(): string {
    return this.appConfig.apiUrl;
  }
  
  /**
   * Get the complete application configuration
   * @returns The full application configuration
   */
  getConfig(): AppConfig {
    return { ...this.appConfig };
  }
  
  /**
   * Parse command line arguments
   * @param args Command line arguments (optional)
   * @returns Parsed command line arguments
   * @protected
   */
  protected parseArgs(args?: string[]): CliArgs {
    const yargsInstance = this.createYargsInstance(args || process.argv.slice(2));
    const parsedArgs = yargsInstance.parseSync();
    
    // Convert to CliArgs type with proper handling of optional arrays
    return {
      date: typeof parsedArgs.date === 'string' ? parsedArgs.date : getTodayDate(),
      country: typeof parsedArgs.country === 'string' ? parsedArgs.country : 'US',
      types: Array.isArray(parsedArgs.types) ? parsedArgs.types : [],
      networks: Array.isArray(parsedArgs.networks) ? parsedArgs.networks : [],
      genres: Array.isArray(parsedArgs.genres) ? parsedArgs.genres : [],
      languages: Array.isArray(parsedArgs.languages) ? parsedArgs.languages : [],
      timeSort: Boolean(parsedArgs.timeSort),
      query: typeof parsedArgs.query === 'string' ? parsedArgs.query : '',
      slack: Boolean(parsedArgs.slack),
      limit: typeof parsedArgs.limit === 'number' ? parsedArgs.limit : 0,
      help: Boolean(parsedArgs.help),
      version: Boolean(parsedArgs.version),
      debug: Boolean(parsedArgs.debug),
      webOnly: Boolean(parsedArgs.webOnly),
      showAll: Boolean(parsedArgs.showAll)
    };
  }
  
  /**
   * Create and configure a yargs instance
   * @param args Command line arguments
   * @returns Configured yargs instance
   * @protected
   */
  protected createYargsInstance(args: string[]): ReturnType<typeof yargs> {
    return yargs(args)
      .options({
        date: {
          alias: 'd',
          describe: 'Date to show TV schedule for (YYYY-MM-DD)',
          type: 'string',
          default: getTodayDate()
        },
        country: {
          alias: 'c',
          describe: 'Country code (e.g., US, GB)',
          type: 'string',
          default: 'US'
        },
        types: {
          describe: 'Show types to include (e.g., Scripted,Reality)',
          type: 'string',
          coerce: (arg: string) => arg.split(',')
        },
        networks: {
          describe: 'Networks to include (e.g., HBO,Netflix)',
          type: 'string',
          coerce: (arg: string) => arg.split(',')
        },
        genres: {
          describe: 'Genres to include (e.g., Drama,Comedy)',
          type: 'string',
          coerce: (arg: string) => arg.split(',')
        },
        languages: {
          describe: 'Languages to include (e.g., English,Spanish)',
          type: 'string',
          coerce: (arg: string) => arg.split(',')
        },
        timeSort: {
          alias: 't',
          describe: 'Sort shows by time',
          type: 'boolean',
          default: false
        },
        query: {
          alias: 'q',
          describe: 'Search query for shows',
          type: 'string',
          default: ''
        },
        slack: {
          alias: 's',
          describe: 'Output to Slack',
          type: 'boolean',
          default: false
        },
        limit: {
          alias: 'l',
          describe: 'Maximum number of shows to display',
          type: 'number',
          default: 0
        },
        debug: {
          alias: 'D',
          describe: 'Enable debug mode',
          type: 'boolean',
          default: false
        },
        webOnly: {
          describe: 'Only show web series',
          type: 'boolean',
          default: false
        },
        showAll: {
          describe: 'Show all shows, including those without air dates',
          type: 'boolean',
          default: false
        }
      })
      .help()
      .alias('help', 'h')
      .version()
      .alias('version', 'v');
  }
  
  /**
   * Load configuration from config file and merge with defaults
   * @returns Merged application configuration
   * @protected
   */
  protected loadConfig(): AppConfig {
    // Default configuration
    const defaultConfig = this.getDefaultConfig();
    
    // Try to load user config from config.json
    let userConfig: Partial<AppConfig> = {};
    try {
      const configPath = this.getConfigFilePath();
      
      if (this.fileExists(configPath)) {
        const configFile = this.readFile(configPath);
        userConfig = this.parseConfigFile(configFile);
      }
    } catch (error) {
      this.handleConfigError(error);
    }
    
    // Merge default and user config
    return {
      ...defaultConfig,
      ...userConfig,
      // Ensure slack config is properly merged
      slack: {
        ...defaultConfig.slack,
        ...(userConfig.slack || {})
      }
    };
  }
  
  /**
   * Get the default configuration
   * @returns Default application configuration
   * @protected
   */
  protected getDefaultConfig(): AppConfig {
    return {
      country: 'US',
      types: [], // e.g., ['Reality', 'Scripted']
      networks: [], // e.g., ['Discovery', 'CBS']
      genres: [], // e.g., ['Drama', 'Comedy']
      languages: ['English'], // Default to English shows
      notificationTime: '9:00', // 24-hour format
      slack: {
        enabled: true,
        botToken: process.env.SLACK_BOT_TOKEN,
        channel: process.env.SLACK_CHANNEL
      },
      appName: 'WhatsOnTV',
      version: '1.0.0',
      apiUrl: 'https://api.tvmaze.com'
    };
  }
  
  /**
   * Get the path to the config file
   * @returns Path to the config file
   * @protected
   */
  protected getConfigFilePath(): string {
    const __filename = this.getFilePath();
    const __dirname = this.getDirname(__filename);
    return this.resolvePath(__dirname, '../../../config.json');
  }
  
  /**
   * Get the current file path
   * @returns Current file path
   * @protected
   */
  protected getFilePath(): string {
    return fileURLToPath(import.meta.url);
  }
  
  /**
   * Get the directory name from a file path
   * @param filePath File path
   * @returns Directory name
   * @protected
   */
  protected getDirname(filePath: string): string {
    return path.dirname(filePath);
  }
  
  /**
   * Resolve a path
   * @param basePath Base path
   * @param relativePath Relative path
   * @returns Resolved path
   * @protected
   */
  protected resolvePath(basePath: string, relativePath: string): string {
    return path.resolve(basePath, relativePath);
  }
  
  /**
   * Check if a file exists
   * @param filePath File path
   * @returns True if the file exists
   * @protected
   */
  protected fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }
  
  /**
   * Read a file
   * @param filePath File path
   * @returns File contents
   * @protected
   */
  protected readFile(filePath: string): string {
    return fs.readFileSync(filePath, 'utf8');
  }
  
  /**
   * Parse a config file
   * @param fileContents File contents
   * @returns Parsed config
   * @protected
   */
  protected parseConfigFile(fileContents: string): Partial<AppConfig> {
    return JSON.parse(fileContents) as Partial<AppConfig>;
  }
  
  /**
   * Handle a config error
   * @param error Error
   * @protected
   */
  protected handleConfigError(error: unknown): void {
    if (error instanceof Error) {
      console.warn(`Warning: Could not load config.json: ${error.message}`);
    }
  }
}
