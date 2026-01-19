/**
 * Configuration type definitions
 * Re-exports types from Zod schemas and defines CLI-only types
 */

// Re-export schema-derived types
export type {
  SlackConfig,
  AppConfig,
  ShowNameFilter
} from '../schemas/config.js';

/**
 * CLI-specific options (not serialized to Lambda)
 */
export interface CliOptions {
  debug: boolean;
  groupByNetwork: boolean;
}
