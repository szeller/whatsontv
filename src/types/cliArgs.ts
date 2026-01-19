/**
 * Command line arguments interface
 * Defines the structure of parsed command line arguments
 */
export interface CliArgs {
  /**
   * Date to search for shows (YYYY-MM-DD format)
   */
  date: string;

  /**
   * Country code to filter shows by
   */
  country: string;

  /**
   * Types of shows to include
   */
  types: string[];

  /**
   * Networks to filter shows by
   */
  networks: string[];

  /**
   * Whether to enable debug mode
   */
  debug: boolean;

  /**
   * Genres to filter shows by
   */
  genres: string[];

  /**
   * Languages to filter shows by
   */
  languages: string[];

  /**
   * Whether to group shows by network
   */
  groupByNetwork: boolean;

  /**
   * Minimum airtime to include (format: HH:MM, 24-hour format)
   */
  minAirtime: string;
}
