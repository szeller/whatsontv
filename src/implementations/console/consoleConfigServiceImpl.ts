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
  private showOptions: ShowOptions;
  private cliOptions: CliOptions;
  private appConfig: AppConfig;
  private cliArgs: CliArgs;
  
  /**
   * Create a new ConsoleConfigServiceImpl
   */
  constructor() {
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
   * @private
   */
  private parseArgs(args?: string[]): CliArgs {
    const parsedArgs = yargs(args || process.argv.slice(2))
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
      .alias('version', 'v')
      .parseSync();
    
    // Convert to CliArgs type with proper handling of optional arrays
    return {
      date: parsedArgs.date,
      country: parsedArgs.country,
      types: Array.isArray(parsedArgs.types) ? parsedArgs.types : [],
      networks: Array.isArray(parsedArgs.networks) ? parsedArgs.networks : [],
      genres: Array.isArray(parsedArgs.genres) ? parsedArgs.genres : [],
      languages: Array.isArray(parsedArgs.languages) ? parsedArgs.languages : [],
      timeSort: Boolean(parsedArgs.timeSort),
      query: String(parsedArgs.query || ''),
      slack: Boolean(parsedArgs.slack),
      limit: Number(parsedArgs.limit || 0),
      help: Boolean(parsedArgs.help),
      version: Boolean(parsedArgs.version),
      debug: Boolean(parsedArgs.debug),
      webOnly: Boolean(parsedArgs.webOnly),
      showAll: Boolean(parsedArgs.showAll)
    };
  }
  
  /**
   * Load configuration from config file and merge with defaults
   * @returns Merged application configuration
   */
  private loadConfig(): AppConfig {
    // Default configuration
    const defaultConfig: AppConfig = {
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
    
    // Try to load user config from config.json
    let userConfig: Partial<AppConfig> = {};
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const configPath = path.resolve(__dirname, '../../../config.json');
      
      if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        userConfig = JSON.parse(configFile);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.warn(`Warning: Could not load config.json: ${error.message}`);
      }
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
}
