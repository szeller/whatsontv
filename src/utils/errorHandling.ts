/**
 * Shared error handling utilities
 */
import type { ConsoleOutput } from '../interfaces/consoleOutput.js';
import type { Show } from '../schemas/domain.js';
import { formatDate } from './dateUtils.js';

/**
 * Register a global uncaught exception handler
 * @param consoleOutput Console output service for logging
 */
export function registerGlobalErrorHandler(consoleOutput: ConsoleOutput): void {
  process.on('uncaughtException', (error) => {
    consoleOutput.error('Uncaught Exception:');
    if (error !== null && typeof error === 'object') {
      consoleOutput.error(`${error.name}: ${error.message}`);
      if (error.stack !== undefined && error.stack !== null && error.stack !== '') {
        consoleOutput.error(error.stack);
      }
    } else {
      consoleOutput.error(String(error));
    }
    process.exit(1);
  });
}

/**
 * Format an error message from any error type
 * @param error The error to format
 * @param prefix Optional prefix to add before the error message
 * @returns Formatted error message
 */
export function formatError(error: unknown, prefix = ''): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return prefix ? `${prefix}${errorMessage}` : errorMessage;
}

/**
 * Handle an unhandled error in the main function
 * @param error The error to handle
 * @param consoleOutput Console output service for logging
 */
export function handleMainError(error: unknown, consoleOutput: ConsoleOutput): void {
  consoleOutput.error(`Unhandled error in main: ${formatError(error)}`);
  // Check for error stack and ensure it's a non-empty string
  const hasStack = error instanceof Error && 
                   typeof error.stack === 'string' && 
                   error.stack.length > 0;
  
  if (hasStack && error instanceof Error) {
    consoleOutput.error(`Stack: ${error.stack}`);
  }
  process.exit(1);
}

/**
 * Check if the current file should execute its main function
 * @returns True if the file should execute its main function
 */
export function isDirectExecution(): boolean {
  // Don't run main() when in a test environment
  return process.env.NODE_ENV !== 'test';
}

/**
 * Generate standardized debug information for shows
 * @param shows List of shows to generate debug information for
 * @param date The date for which shows are being displayed
 * @returns Object containing debug information
 */
export function generateDebugInfo(shows: Show[], date: Date): {
  dateFormatted: string;
  networks: string[];
  totalShows: number;
} {
  const uniqueNetworks = new Set<string>();
  
  for (const show of shows) {
    if (show.network && typeof show.network === 'string') {
      uniqueNetworks.add(show.network);
    }
  }
  
  return {
    dateFormatted: formatDate(date),
    networks: [...uniqueNetworks].sort(),
    totalShows: shows.length
  };
}

/**
 * Safely resolve a promise for methods that need to be async but don't have async operations
 * Used to satisfy lint rules requiring await in async methods
 */
export async function safeResolve(): Promise<void> {
  await Promise.resolve();
}
