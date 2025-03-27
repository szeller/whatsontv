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
      // Use arrays from config file, ensuring they're always arrays
      types: Array.isArray(this.cliArgs.types) && this.cliArgs.types.length > 0 
        ? this.cliArgs.types 
        : [...(Array.isArray(this.appConfig.types) ? this.appConfig.types : [])],
      networks: Array.isArray(this.cliArgs.networks) && this.cliArgs.networks.length > 0 
        ? this.cliArgs.networks 
        : [...(Array.isArray(this.appConfig.networks) ? this.appConfig.networks : [])],
      genres: Array.isArray(this.cliArgs.genres) && this.cliArgs.genres.length > 0 
        ? this.cliArgs.genres 
        : [...(Array.isArray(this.appConfig.genres) ? this.appConfig.genres : [])],
      languages: Array.isArray(this.cliArgs.languages) && this.cliArgs.languages.length > 0 
        ? this.cliArgs.languages 
        : [...(Array.isArray(this.appConfig.languages) ? this.appConfig.languages : [])],
      fetchSource: this.cliArgs.fetch ?? 'all'
    };
    
    // Extract CLI options
    this.cliOptions = {
      debug: this.cliArgs.debug ?? false,
      help: this.cliArgs.help ?? false
    };
  }
  
  /**
   * Get the show options from the configuration
   * @returns ShowOptions object with all show filters and options
   */
  getShowOptions(): ShowOptions {
    // Get the base show options from the config
    const configOptions = { ...this.showOptions };
    
    // Get command line arguments
    const args = this.parseArgs();
    
    // Create a merged options object
    const mergedOptions: ShowOptions = {
      ...configOptions,
      // Override with command line arguments if provided
      date: args.date || configOptions.date,
      country: args.country || configOptions.country,
      fetchSource: args.fetch || configOptions.fetchSource,
      // Use the filter arrays from the config file
      types: [...(configOptions.types || [])],
      genres: [...(configOptions.genres || [])],
      networks: [...(configOptions.networks || [])],
      languages: [...(configOptions.languages || [])]
    };
    
    // Override with command line arguments if provided
    if (Array.isArray(args.types) && args.types.length > 0) {
      mergedOptions.types = args.types;
    }
    
    if (Array.isArray(args.genres) && args.genres.length > 0) {
      mergedOptions.genres = args.genres;
    }
    
    if (Array.isArray(args.networks) && args.networks.length > 0) {
      mergedOptions.networks = args.networks;
    }
    
    if (Array.isArray(args.languages) && args.languages.length > 0) {
      mergedOptions.languages = args.languages;
    }
    
    return mergedOptions;
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
      help: Boolean(parsedArgs.help),
      debug: Boolean(parsedArgs.debug),
      fetch: this.validateFetchSource(parsedArgs.fetch)
    };
  }
  
  /**
   * Validate and normalize the fetch source parameter
   * @param value The fetch source value from command line
   * @returns A valid fetch source value ('web', 'network', or 'all')
   * @private
   */
  private validateFetchSource(value: unknown): 'web' | 'network' | 'all' {
    if (typeof value !== 'string') {
      return 'all';
    }
    
    const normalized = value.toLowerCase();
    if (normalized === 'web' || normalized === 'network') {
      return normalized;
    }
    
    return 'all';
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
        fetch: {
          alias: 'f',
          describe: 'Fetch source (e.g., all, web, tv)',
          type: 'string',
          default: 'all'
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
    const mergedConfig = {
      ...defaultConfig,
      ...userConfig,
      // Ensure slack config is properly merged
      slack: {
        ...defaultConfig.slack,
        ...(userConfig.slack || {})
      }
    };
    
    return mergedConfig;
  }
  
  /**
   * Get the default configuration
   * @returns Default configuration
   * @protected
   */
  protected getDefaultConfig(): AppConfig {
    return {
      country: 'US',
      types: [], // e.g., ['Reality', 'Scripted']
      networks: [], // e.g., ['Discovery', 'CBS']
      genres: [], // e.g., ['Drama', 'Comedy']
      languages: [], // e.g., ['English']
      notificationTime: '09:00', // 24-hour format
      slack: {
        enabled: false
      }
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
      console.error(`Warning: Could not load config.json: ${error.message}`);
    }
  }
}
