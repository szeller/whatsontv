/**
 * Base implementation of ConfigService with shared logic
 * Subclasses implement their own initialization strategies
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ConfigService } from '../interfaces/configService.js';
import type { ShowOptions } from '../types/tvShowOptions.js';
import type { CliOptions, AppConfig, SlackConfig } from '../types/configTypes.js';
import { parseDateString } from '../utils/dateUtils.js';
import { getDefaultConfig } from '../utils/configUtils.js';
import {
  fileExists,
  readFile,
  parseConfigFile,
  handleConfigError
} from '../utils/fileUtils.js';

/**
 * Abstract base class for ConfigService implementations
 * Provides shared functionality for config loading and option retrieval
 */
export abstract class BaseConfigServiceImpl implements ConfigService {
  protected showOptions!: ShowOptions;
  protected cliOptions!: CliOptions;
  protected appConfig!: AppConfig;
  protected dateString!: string;

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
   * Get optional environment variable with default
   * @param key Environment variable name
   * @param defaultValue Default value if not set
   * @returns Environment variable value or default
   * @protected
   */
  protected getOptionalEnv(key: string, defaultValue: string): string {
    const value = process.env[key];
    return (value !== undefined && value.trim() !== '') ? value : defaultValue;
  }

  /**
   * Get Slack configuration options
   * @returns The Slack configuration options
   */
  getSlackOptions(): SlackConfig {
    // Start with environment variables as the base
    const envSlackOptions: SlackConfig = {
      token: this.getOptionalEnv('SLACK_TOKEN', ''),
      channelId: this.getOptionalEnv('SLACK_CHANNEL', ''),
      username: this.getOptionalEnv('SLACK_USERNAME', 'WhatsOnTV'),
      icon_emoji: ':tv:',
      dateFormat: 'dddd, MMMM D, YYYY'
    };

    // If slack is configured in appConfig, merge non-empty values
    // Priority: non-empty appConfig values override env vars; empty appConfig values are ignored
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this.appConfig.slack !== undefined) {
      const appSlack = this.appConfig.slack as Partial<SlackConfig>;
      const hasToken = appSlack.token !== undefined && appSlack.token.trim() !== '';
      const hasChannel = appSlack.channelId !== undefined
        && appSlack.channelId.trim() !== '';
      const hasUsername = appSlack.username !== undefined
        && appSlack.username.trim() !== '';
      const hasEmoji = appSlack.icon_emoji !== undefined;
      const hasDateFormat = appSlack.dateFormat !== undefined;

      return {
        ...envSlackOptions,
        // Only use appConfig values if they're non-empty strings
        ...(hasToken ? { token: appSlack.token } : {}),
        ...(hasChannel ? { channelId: appSlack.channelId } : {}),
        ...(hasUsername ? { username: appSlack.username } : {}),
        ...(hasEmoji ? { icon_emoji: appSlack.icon_emoji } : {}),
        ...(hasDateFormat ? { dateFormat: appSlack.dateFormat } : {})
      };
    }

    return envSlackOptions;
  }

  /**
   * Get the date to use for TV show display
   * Returns current date if not explicitly set
   * @returns Date object for the configured date
   */
  getDate(): Date {
    return parseDateString(this.dateString);
  }

  /**
   * Check if debug mode is enabled
   * @returns True if debug mode is enabled
   */
  isDebugMode(): boolean {
    return this.cliOptions.debug;
  }

  /**
   * Load configuration from config file and merge with defaults
   * @param configFilePath Optional path to config file (for Lambda)
   * @returns Merged application configuration
   * @protected
   */
  protected loadConfig(configFilePath?: string): AppConfig {
    // Default configuration
    const defaultConfig = getDefaultConfig();

    // Try to load user config from config.json
    let userConfig: Partial<AppConfig> = {};
    try {
      // Compute config path: base class is at src/implementations/baseConfigServiceImpl.ts
      // So we go up 2 levels to reach project root where config.json lives
      let configPath: string;
      if (configFilePath !== undefined && configFilePath.trim() !== '') {
        configPath = configFilePath;
      } else {
        const envConfigFile = process.env.CONFIG_FILE;
        if (envConfigFile !== undefined && envConfigFile.trim() !== '') {
          configPath = envConfigFile;
        } else {
          const currentDir = path.dirname(fileURLToPath(import.meta.url));
          configPath = path.resolve(currentDir, '../../config.json');
        }
      }

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
        ...userConfig.slack
      }
    };

    return mergedConfig;
  }
}
