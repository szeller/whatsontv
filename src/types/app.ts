/**
 * Application-specific types
 */
import type { Show } from './tvmaze.js';

/**
 * Shows grouped by network name
 */
export interface NetworkGroups {
  [networkName: string]: Show[];
}
