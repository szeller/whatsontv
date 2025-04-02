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
    
    // Set initial show options from config
    this.showOptions = this.mergeShowOptions(this.cliArgs, this.appConfig);
  }

  /**
   * Merge CLI arguments with app configuration to create show options
   * @param cliArgs CLI arguments
   * @param appConfig Application configuration
   * @param baseOptions Optional base options to merge with
   * @returns Merged ShowOptions object
   * @protected
   */
  protected mergeShowOptions(
    cliArgs: CliArgs, 
    appConfig: AppConfig, 
    baseOptions?: Partial<ShowOptions>
  ): ShowOptions {
    // Start with base options or empty object
    const base = baseOptions || {};
    
    // Safely handle potentially null/undefined values
    const cliDate = typeof cliArgs.date !== 'undefined' && cliArgs.date !== null ? 
      String(cliArgs.date) : '';
    const cliCountry = typeof cliArgs.country !== 'undefined' && cliArgs.country !== null ? 
      String(cliArgs.country) : '';
    
    // Safely handle base options
    const baseDate = typeof base.date !== 'undefined' && base.date !== null ? 
      base.date : getTodayDate();
    const baseCountry = typeof base.country !== 'undefined' && base.country !== null ? 
      base.country : appConfig.country;
    const baseFetchSource = typeof base.fetchSource !== 'undefined' && base.fetchSource !== null ? 
      base.fetchSource : 'all';
    
    return {
      // Use base options as fallback if provided
      date: getStringValue(
        cliDate, 
        baseDate
      ),
      country: getStringValue(
        cliCountry, 
        baseCountry
      ),
      // Use utility functions for array handling
      types: mergeArraysWithPriority(
        toStringArray(cliArgs.types), 
        base.types || toStringArray(appConfig.types)
      ),
      networks: mergeArraysWithPriority(
        toStringArray(cliArgs.networks), 
        base.networks || toStringArray(appConfig.networks)
      ),
      genres: mergeArraysWithPriority(
        toStringArray(cliArgs.genres), 
        base.genres || toStringArray(appConfig.genres)
      ),
      languages: mergeArraysWithPriority(
        toStringArray(cliArgs.languages), 
        base.languages || toStringArray(appConfig.languages)
      ),
      // Handle fetch source with conditional coercion
      fetchSource: typeof cliArgs.fetch !== 'undefined' && cliArgs.fetch !== null ? 
        coerceFetchSource(cliArgs.fetch) : 
        baseFetchSource
    };
  }
  
  /**
   * Get show options from the configuration and CLI arguments
   * Used during initialization to set the initial show options
   * @returns ShowOptions object with merged values
   * @protected
   */
  protected getShowOptionsFromConfig(): ShowOptions {
    return this.mergeShowOptions(this.cliArgs, this.appConfig);
  }
  
  /**
   * Get the show options from the configuration
   * @returns ShowOptions object with all show filters and options
   */
  getShowOptions(): ShowOptions {
    // Get fresh command line arguments
    const args = this.parseArgs();
    
    // Merge with current show options
    return this.mergeShowOptions(args, this.appConfig, this.showOptions);
  }
  
  /**
   * Get a specific show option value
   * @param key Show option key
   * @returns Value for the specified key
   */
  getShowOption<K extends keyof ShowOptions>(key: K): ShowOptions[K] {
    // Get the merged options to ensure consistency with getShowOptions()
    const mergedOptions = this.getShowOptions();
    return mergedOptions[key];
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
