/**
 * String utility functions for the application
 */

/**
 * Get a string value or a default if empty/null/undefined
 * @param value - The string to check
 * @param defaultValue - The default value to use
 * @returns The input value if valid, or the default value
 */
export function getStringOrDefault(value: string | null | undefined, defaultValue: string): string {
  if (value === undefined || value === null || value.trim() === '') {
    return defaultValue;
  }
  return value.trim();
}
