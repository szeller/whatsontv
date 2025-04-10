/**
 * Configuration type definitions
 */

/**
 * Slack integration configuration
 */
export interface SlackConfig {
  token: string;
  channelId: string;
  username: string;
  icon_emoji?: string;
  dateFormat?: string;
}

/**
 * Application configuration structure
 */
export interface AppConfig {
  country: string;
  types: string[];
  networks: string[];
  genres: string[];
  languages: string[];
  notificationTime: string;
  slack: SlackConfig;
}

/**
 * CLI-specific options
 */
export interface CliOptions {
  debug: boolean;
  groupByNetwork: boolean;
}
