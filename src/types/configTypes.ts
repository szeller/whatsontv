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
 * Application runtime configuration structure
 *
 * This is intentionally separate from infrastructure/whatsontv-stack.ts AppConfig:
 * - This type: Full runtime config with filters, timing, display options
 * - whatsontv-stack.ts: Minimal CDK deployment config (just Slack credentials)
 *
 * This config is read at runtime from config.json (or config.lambda.json in Lambda).
 */
export interface AppConfig {
  country: string;
  types: string[];
  networks: string[];
  genres: string[];
  languages: string[];
  minAirtime: string;
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
