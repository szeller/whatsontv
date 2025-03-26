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
  
  /** Source to fetch shows from: 'web', 'network', or 'all' */
  fetchSource?: 'web' | 'network' | 'all';
}
