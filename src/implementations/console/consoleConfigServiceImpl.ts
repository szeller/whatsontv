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
import type { CliOptions, AppConfig, SlackConfig } from '../../types/configTypes.js';
import type { CliArgs } from '../../types/cliArgs.js';
import { getTodayDate } from '../../utils/dateUtils.js';
import { getStringValue } from '../../utils/stringUtils.js';
import { 
  toStringArray, 
  resolveRelativePath,
  coerceFetchSource,
  mergeShowOptions
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
      groupByNetwork: Boolean(this.cliArgs.groupByNetwork)
    };
    
    // Set initial show options from config
    this.showOptions = mergeShowOptions(this.cliArgs, this.appConfig);
  }

  /**
   * Get the show options from the configuration
   * @returns ShowOptions object with all show filters and options
   */
  getShowOptions(): ShowOptions {
    return this.showOptions;
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
   * Get Slack configuration options
   * @returns The Slack configuration options
   */
  getSlackOptions(): SlackConfig {
    // Return default Slack options if not configured
    const defaultSlackOptions: SlackConfig = {
      token: process.env.SLACK_TOKEN !== undefined 
        && process.env.SLACK_TOKEN !== null 
        ? process.env.SLACK_TOKEN 
        : '',
      channelId: process.env.SLACK_CHANNEL !== undefined 
        && process.env.SLACK_CHANNEL !== null 
        ? process.env.SLACK_CHANNEL 
        : '',
      username: process.env.SLACK_USERNAME !== undefined 
        && process.env.SLACK_USERNAME !== null 
        ? process.env.SLACK_USERNAME 
        : 'WhatsOnTV',
      icon_emoji: ':tv:',
      dateFormat: 'dddd, MMMM D, YYYY'
    };
    
    // If slack is configured in appConfig, merge with defaults
    if (this.appConfig.slack !== undefined && this.appConfig.slack !== null) {
      return {
        ...defaultSlackOptions,
        ...(this.appConfig.slack as Partial<SlackConfig>)
      };
    }
    
    return defaultSlackOptions;
  }
  
  /**
   * Get the date to use for TV show display
   * Returns current date if not explicitly set
   * @returns Date object for the configured date
   */
  getDate(): Date {
    const dateArg = this.getDateArg();
    // Explicitly check for null, undefined, or empty string
    if (dateArg !== undefined && dateArg !== null && dateArg !== '') {
      // Fix timezone issue by ensuring date is interpreted in local timezone
      const [year, month, day] = dateArg.split('-').map(Number);
      // Month is 0-indexed in JavaScript Date
      return new Date(year, month - 1, day);
    }
    return new Date();
  }
  
  /**
   * Check if debug mode is enabled
   * @returns True if debug mode is enabled
   */
  isDebugMode(): boolean {
    // Get CLI options and check debug flag
    const cliOptions = this.getCliOptions();
    return cliOptions.debug === true;
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
      minAirtime: getStringValue(String(parsedArgs.minAirtime), '18:00'),
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
      .option({
        date: {
          alias: 'd',
          describe: 'Date to get schedule for (YYYY-MM-DD)',
          type: 'string'
        },
        country: {
          alias: 'c',
          describe: 'Country code (e.g., US, GB)',
          type: 'string',
          default: 'US'
        },
        types: {
          alias: 't',
          describe: 'Show types to include (e.g., Scripted,Reality)',
          type: 'string',
          coerce: (arg: string) => toStringArray(arg)
        },
        networks: {
          alias: 'n',
          describe: 'Networks to include (e.g., CBS,HBO)',
          type: 'string',
          coerce: (arg: string) => toStringArray(arg)
        },
        genres: {
          alias: 'g',
          describe: 'Genres to include (e.g., Drama,Comedy)',
          type: 'string',
          coerce: (arg: string) => toStringArray(arg)
        },
        languages: {
          describe: 'Languages to include (e.g., English,Spanish)',
          type: 'string',
          coerce: (arg: string) => toStringArray(arg)
        },
        minAirtime: {
          describe: 'Minimum airtime to include (format: HH:MM, 24-hour format)',
          type: 'string',
          default: '18:00'
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
      minAirtime: '18:00', // Default to primetime shows
      notificationTime: '09:00', // 24-hour format
      slack: {
        token: '',
        channelId: '',
        username: 'WhatsOnTV'
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
  
  /**
   * Get the date argument from the CLI args
   * @returns Date argument
   */
  protected getDateArg(): string | undefined {
    return this.cliArgs.date;
  }
}
