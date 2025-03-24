/**
 * Date utility functions for the application
 */

/**
 * Get today's date in YYYY-MM-DD format
 * @returns Today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  const today = new Date();
  return formatDate(today);
}

/**
 * Format a date as YYYY-MM-DD
 * @param date - The date to format
 * @returns The formatted date string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
