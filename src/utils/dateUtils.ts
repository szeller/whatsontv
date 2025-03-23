/**
 * Utility functions for date operations
 */

/**
 * Format time string to 12-hour format
 * @param time Time string in HH:MM format
 * @returns Formatted time string
 */
export function formatTime(time: string | undefined): string {
  // Explicitly handle null, undefined, and empty string cases
  if (time === undefined || time === null || time === '') {
    return 'TBA';
  }
  
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  
  return `${formattedHour}:${minutes} ${ampm}`;
}
