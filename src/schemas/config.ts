/**
 * Zod schemas for application configuration
 */
import { z } from 'zod';

/**
 * Show name filter - array of patterns to exclude
 * Supports regex patterns or literal strings (case-insensitive)
 */
export const showNameFilterSchema = z.array(z.string()).default([]);

/**
 * Slack integration configuration
 */
export const slackConfigSchema = z.object({
  token: z.string(),
  channelId: z.string(),
  username: z.string().default('WhatsOnTV'),
  icon_emoji: z.string().optional(),
  dateFormat: z.string().optional()
});

/**
 * Options for fetching and filtering TV shows
 * Used by both CLI and Lambda to control show filtering
 */
export const showOptionsSchema = z.object({
  /** Date in YYYY-MM-DD format */
  date: z.string().optional(),
  /** Country code (e.g., 'US') */
  country: z.string().optional(),
  /** Timezone for date calculations (IANA format) */
  timezone: z.string().optional(),
  /** Show types to include */
  types: z.array(z.string()).optional(),
  /** Networks to include */
  networks: z.array(z.string()).optional(),
  /** Genres to include */
  genres: z.array(z.string()).optional(),
  /** Languages to include */
  languages: z.array(z.string()).optional(),
  /** Minimum airtime to include (format: HH:MM, 24-hour format) */
  minAirtime: z.string().optional(),
  /** Show names to exclude (regex patterns or literal strings) */
  excludeShowNames: z.array(z.string()).optional()
});

/**
 * Full application configuration
 * Combines ShowOptions fields with operational config
 */
export const appConfigSchema = z.object({
  country: z.string().default('US'),
  timezone: z.string().optional(),
  types: z.array(z.string()).default([]),
  networks: z.array(z.string()).default([]),
  genres: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  minAirtime: z.string().default('18:00'),
  notificationTime: z.string().default('09:00'),
  showNameFilter: showNameFilterSchema.optional(),
  slack: slackConfigSchema,
  operationsEmail: z.string().optional()
});

// Export inferred types from schemas
export type ShowNameFilter = z.infer<typeof showNameFilterSchema>;
export type SlackConfig = z.infer<typeof slackConfigSchema>;
export type ShowOptions = z.infer<typeof showOptionsSchema>;
export type AppConfig = z.infer<typeof appConfigSchema>;

/**
 * Extract ShowOptions fields from AppConfig for Lambda environment serialization
 * Excludes operational fields (slack, notificationTime, operationsEmail)
 * @param config Full application config
 * @returns Partial ShowOptions suitable for Lambda APP_CONFIG env var
 */
export function extractShowOptionsForLambda(
  config: AppConfig
): Omit<ShowOptions, 'date'> {
  return {
    country: config.country,
    timezone: config.timezone,
    types: config.types,
    networks: config.networks,
    genres: config.genres,
    languages: config.languages,
    minAirtime: config.minAirtime,
    excludeShowNames: config.showNameFilter
  };
}
