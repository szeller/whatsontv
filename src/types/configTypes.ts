/**
 * Configuration type definitions
 */

/**
 * Slack integration configuration
 */
export interface SlackConfig {
  enabled: boolean;
  botToken?: string;
  channel?: string;
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
  help: boolean;
  groupByNetwork: boolean;
}
