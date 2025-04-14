/**
 * Interface for application configuration service
 */
import type { ShowOptions } from '../types/tvShowOptions.js';
import type { CliOptions, AppConfig, SlackConfig } from '../types/configTypes.js';

export interface ConfigService {
  /**
   * Get the complete show options configuration
   * @returns Configuration options for fetching and displaying shows
   */
  getShowOptions(): ShowOptions;
  
  /**
   * Get a specific show option value
   * @param key Show option key
   * @returns Value for the specified key
   */
  getShowOption<K extends keyof ShowOptions>(key: K): ShowOptions[K];
  
  /**
   * Get CLI-specific flags and options
   * @returns CLI-specific configuration options
   */
  getCliOptions(): CliOptions;
  
  /**
   * Get the complete application configuration
   * @returns The full application configuration
   */
  getConfig(): AppConfig;
  
  /**
   * Get Slack configuration options
   * @returns The Slack configuration options
   */
  getSlackOptions(): SlackConfig;

  /**
   * Get the date to use for TV show display
   * Returns current date if not explicitly set
   * @returns Date object for the configured date
   */
  getDate(): Date;
  
  /**
   * Check if debug mode is enabled
   * @returns True if debug mode is enabled
   */
  isDebugMode(): boolean;
}
