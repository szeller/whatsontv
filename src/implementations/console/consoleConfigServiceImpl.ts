/**
 * Implementation of ConfigService that combines CLI arguments and config file
 */
import { injectable } from 'tsyringe';
import yargs from 'yargs';

import type { ConfigService } from '../../interfaces/configService.js';
import type { ShowOptions } from '../../types/tvShowOptions.js';
import type { CliOptions, AppConfig, SlackConfig } from '../../types/configTypes.js';
import type { CliArgs } from '../../types/cliArgs.js';
import { getTodayDate, parseDateString } from '../../utils/dateUtils.js';
import { getStringValue } from '../../utils/stringUtils.js';
import { 
  toStringArray, 
  coerceFetchSource,
  mergeShowOptions,
  getDefaultConfig
} from '../../utils/configUtils.js';
import {
  fileExists,
  readFile,
  parseConfigFile,
  handleConfigError,
  getConfigFilePath
} from '../../utils/fileUtils.js';

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
    return parseDateString(this.cliArgs.date);
  }
  
  /**
   * Check if debug mode is enabled
   * @returns True if debug mode is enabled
   */
  isDebugMode(): boolean {
    return Boolean(this.cliOptions.debug);
  }
  
  /**
   * Parse command line arguments
   * @param args Optional array of command line arguments
   * @returns Parsed CLI arguments
   * @protected
   */
  protected parseArgs(args?: string[]): CliArgs {
    // Create a yargs instance with our options
    const yargsInstance = this.createYargsInstance(args || process.argv.slice(2));
    
    // Parse the arguments - use parseSync to ensure we get a synchronous result
    const parsedArgs = yargsInstance.parseSync();
    
    // Convert to our CliArgs type with proper type handling
    return {
      date: getStringValue(String(parsedArgs.date ?? ''), getTodayDate()),
      country: getStringValue(String(parsedArgs.country ?? ''), 'US'),
      types: toStringArray(parsedArgs.types as string | string[] | undefined),
      networks: toStringArray(parsedArgs.networks as string | string[] | undefined),
      genres: toStringArray(parsedArgs.genres as string | string[] | undefined),
      languages: toStringArray(parsedArgs.languages as string | string[] | undefined),
      minAirtime: getStringValue(String(parsedArgs.minAirtime ?? ''), '18:00'),
      debug: Boolean(parsedArgs.debug),
      fetch: coerceFetchSource(parsedArgs.fetch),
      groupByNetwork: true // Default to true, not configurable via CLI yet
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
          describe: 'Date to show TV listings for (format: YYYY-MM-DD)',
          type: 'string',
          default: getTodayDate()
        },
        country: {
          alias: 'c',
          describe: 'Country code (e.g., US, UK, CA)',
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
          describe: 'Networks to include (e.g., HBO,Netflix)',
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
          alias: 'l',
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
    const defaultConfig = getDefaultConfig();
    
    // Try to load user config from config.json
    let userConfig: Partial<AppConfig> = {};
    try {
      const configPath = getConfigFilePath(import.meta.url);
      
      if (fileExists(configPath)) {
        const configFile = readFile(configPath);
        userConfig = parseConfigFile(configFile);
      }
    } catch (error) {
      handleConfigError(error);
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
}
