/**
 * Options for fetching and filtering TV shows
 */
export interface ShowOptions {
  /** Date in YYYY-MM-DD format */
  date?: string;
  
  /** Country code (e.g., 'US') */
  country?: string;
  
  /** Show types to include */
  types?: string[];
  
  /** Networks to include */
  networks?: string[];
  
  /** Genres to include */
  genres?: string[];
  
  /** Languages to include */
  languages?: string[];
  
  /** Whether to only include web/streaming shows */
  webOnly?: boolean;
  
  /** Whether to include both network and web shows */
  showAll?: boolean;
}
