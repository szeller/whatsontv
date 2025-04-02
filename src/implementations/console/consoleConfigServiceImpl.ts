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
import { getStringValue } from '../../utils/stringUtils.js';
import { 
  toStringArray, 
  mergeArraysWithPriority, 
  resolveRelativePath,
  coerceFetchSource
} from '../../utils/configUtils.js';

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
    
    // Load configuration
    this.appConfig = this.loadConfig();
    
    // Set CLI options
    this.cliOptions = {
      debug: Boolean(this.cliArgs.debug),
      help: Boolean(this.cliArgs.help),
      groupByNetwork: Boolean(this.cliArgs.groupByNetwork)
    };
    
    // Set show options
    this.showOptions = this.getShowOptionsFromConfig();
  }

  /**
   * Get show options from the configuration and CLI arguments
   * @returns ShowOptions object with merged values
   * @protected
   */
  protected getShowOptionsFromConfig(): ShowOptions {
    return {
      date: getStringValue(this.cliArgs.date, getTodayDate()),
      country: getStringValue(this.cliArgs.country, this.appConfig.country),
      // Use utility functions for array handling
      types: mergeArraysWithPriority(
        toStringArray(this.cliArgs.types), 
        toStringArray(this.appConfig.types)
      ),
      networks: mergeArraysWithPriority(
        toStringArray(this.cliArgs.networks), 
        toStringArray(this.appConfig.networks)
      ),
      genres: mergeArraysWithPriority(
        toStringArray(this.cliArgs.genres), 
        toStringArray(this.appConfig.genres)
      ),
      languages: mergeArraysWithPriority(
        toStringArray(this.cliArgs.languages), 
        toStringArray(this.appConfig.languages)
      ),
      fetchSource: coerceFetchSource(this.cliArgs.fetch)
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
      date: getStringValue(String(args.date || ''), configOptions.date),
      country: getStringValue(String(args.country || ''), configOptions.country),
      fetchSource: args.fetch ? coerceFetchSource(args.fetch) : configOptions.fetchSource,
      // Use utility functions for array handling
      types: mergeArraysWithPriority(
        toStringArray(args.types), 
        configOptions.types
      ),
      genres: mergeArraysWithPriority(
        toStringArray(args.genres), 
        configOptions.genres
      ),
      networks: mergeArraysWithPriority(
        toStringArray(args.networks), 
        configOptions.networks
      ),
      languages: mergeArraysWithPriority(
        toStringArray(args.languages), 
        configOptions.languages
      )
    };
    
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
   * Get help text for the application
   * @returns The help text to display to users
   */
  getHelpText(): string {
    return `
WhatsOnTV - TV Show Schedule Viewer

Usage: whatsontv [options]

Options:
  --date, -d         Date to show TV schedule for (YYYY-MM-DD)
  --country, -c      Country code (e.g., US, GB)
  --types            Show types to include (e.g., Scripted,Reality)
  --networks         Networks to include (e.g., HBO,Netflix)
  --genres           Genres to include (e.g., Drama,Comedy)
  --languages        Languages to include (e.g., English,Spanish)
  --fetch, -f        Fetch source (web, network, all)
  --debug, -D        Enable debug mode
  --help, -h         Show this help message
  --group-by-network Group shows by network (default: true)

Examples:
  whatsontv                         Show today's TV schedule
  whatsontv --date 2023-04-01       Show schedule for April 1, 2023
  whatsontv --networks HBO,Netflix  Show only HBO and Netflix shows
  whatsontv --types Scripted        Show only scripted shows
  whatsontv --fetch web             Show only web/streaming shows
`;
  }
  
  /**
   * Parse command line arguments
   * @param args Optional array of command line arguments
   * @returns Parsed CLI arguments
   * @protected
   */
  protected parseArgs(args?: string[]): CliArgs {
    const yargsInstance = this.createYargsInstance(args || process.argv.slice(2));
    
    // In tests, we need to disable strict mode and exit behavior
    const parsedArgs = yargsInstance
      .parserConfiguration({
        'boolean-negation': false,
        'camel-case-expansion': false,
        'dot-notation': false,
        'duplicate-arguments-array': false,
        'halt-at-non-option': false,
        'strip-aliased': true,
        'strip-dashed': true,
        'unknown-options-as-args': true
      })
      .fail(false)
      .parseSync();
    
    // Convert to CliArgs type with proper handling of optional arrays
    return {
      date: getStringValue(String(parsedArgs.date), getTodayDate()),
      country: getStringValue(String(parsedArgs.country), 'US'),
      types: toStringArray(parsedArgs.types as string | string[] | undefined),
      networks: toStringArray(parsedArgs.networks as string | string[] | undefined),
      genres: toStringArray(parsedArgs.genres as string | string[] | undefined),
      languages: toStringArray(parsedArgs.languages as string | string[] | undefined),
      help: Boolean(parsedArgs.help),
      debug: Boolean(parsedArgs.debug),
      fetch: parsedArgs.fetch !== undefined ? 
        coerceFetchSource(parsedArgs.fetch as string) : 'network',
      groupByNetwork: parsedArgs['group-by-network'] !== undefined 
        ? Boolean(parsedArgs['group-by-network']) 
        : true // Default to true if not specified
    };
  }
  
  /**
   * Validate and normalize the fetch source parameter
   * @param value The fetch source value from command line
   * @returns A valid fetch source value ('web', 'network', or 'all')
   * @private
   */
  private validateFetchSource(value: unknown): 'web' | 'network' | 'all' {
    return coerceFetchSource(value);
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
      .alias('help', 'h');
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
    const dirname = this.getDirname(this.getFilePath());
    return resolveRelativePath(dirname, '../../../config.json');
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
    return resolveRelativePath(basePath, relativePath);
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
