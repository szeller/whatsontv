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

/**
 * Convert a time string to minutes since midnight for comparison
 * Handles various time formats including "HH:MM", "H:MM", with optional AM/PM
 * @param timeStr - The time string to convert
 * @returns Minutes since midnight, or -1 if the time string is invalid
 */
export function convertTimeToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') {
    return -1;
  }

  // Normalize the time format
  let hours = 0;
  let minutes = 0;
  
  // Handle various time formats
  if (timeStr.includes(':')) {
    // Format: "HH:MM" or "H:MM" with optional AM/PM
    const timeParts = timeStr.split(':');
    if (timeParts.length !== 2 || isNaN(parseInt(timeParts[0], 10))) {
      return -1;
    }
    
    hours = parseInt(timeParts[0], 10);
    
    // Extract minutes, removing any AM/PM suffix
    const minutesPart = timeParts[1].replace(/\s*[APap][Mm].*$/, '');
    if (isNaN(parseInt(minutesPart, 10))) {
      return -1;
    }
    minutes = parseInt(minutesPart, 10);
    
    // Handle AM/PM if present
    const isPM = /\s*[Pp][Mm]/.test(timeStr);
    const isAM = /\s*[Aa][Mm]/.test(timeStr);
    
    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
  } else {
    // Format without colon, assume it's just hours
    if (isNaN(parseInt(timeStr, 10))) {
      return -1;
    }
    hours = parseInt(timeStr, 10);
  }
  
  return hours * 60 + minutes;
}
