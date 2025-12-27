/**
 * Date utility functions for the application
 */
import { hasContent } from './stringUtils.js';

/**
 * Get today's date in YYYY-MM-DD format
 * @param timezone - Optional IANA timezone (e.g., 'America/Los_Angeles')
 * @returns Today's date in YYYY-MM-DD format
 */
export function getTodayDate(timezone?: string): string {
  const now = new Date();

  if (timezone !== undefined && timezone !== null && timezone.trim() !== '') {
    // Use Intl.DateTimeFormat to get the date in the specified timezone
    // en-CA locale uses YYYY-MM-DD format natively
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(now);
  }

  return formatDate(now);
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
 * Parse a time string to extract hours and minutes
 * Handles various formats including "HH:MM", "H:MM", with optional AM/PM
 * @param timeStr - The time string to parse
 * @returns Object with hours and minutes, or null if invalid
 */
export function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr || typeof timeStr !== 'string') {
    return null;
  }

  let hours = 0;
  let minutes = 0;
  
  // Handle various time formats
  if (timeStr.includes(':')) {
    // Format: "HH:MM" or "H:MM" with optional AM/PM
    const timeParts = timeStr.split(':');
    if (timeParts.length !== 2 || isNaN(parseInt(timeParts[0], 10))) {
      return null;
    }
    
    hours = parseInt(timeParts[0], 10);
    
    // Extract minutes, removing any AM/PM suffix
    const minutesPart = timeParts[1].replace(/\s*[APap][Mm].*$/, '');
    if (isNaN(parseInt(minutesPart, 10))) {
      return null;
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
      return null;
    }
    hours = parseInt(timeStr, 10);
  }
  
  return { hours, minutes };
}

/**
 * Convert a time string to minutes since midnight for comparison
 * Handles various time formats including "HH:MM", "H:MM", with optional AM/PM
 * @param timeStr - The time string to convert
 * @returns Minutes since midnight, or -1 if the time string is invalid
 */
export function convertTimeToMinutes(timeStr: string): number {
  const parsedTime = parseTimeString(timeStr);
  if (parsedTime === null) {
    return -1;
  }
  
  return parsedTime.hours * 60 + parsedTime.minutes;
}

/**
 * Format time string to 12-hour format with AM/PM
 * @param time - Time string in HH:MM format
 * @returns Formatted time string (e.g., "8:30 PM")
 */
export function formatTimeWithPeriod(time: string | null | undefined): string {
  if (!hasContent(time)) {
    return 'N/A';
  }

  const parsedTime = parseTimeString(time);
  if (parsedTime === null) {
    return 'N/A';
  }
  
  const { hours, minutes } = parsedTime;
  
  // Convert to 12-hour format
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Validates if a string is a valid time format
 * @param time - The time string to validate
 * @returns True if the time is valid, false otherwise
 */
export function isValidTime(time: string | null | undefined): boolean {
  if (!hasContent(time)) {
    return false;
  }

  return parseTimeString(time) !== null;
}

/**
 * Parse a date string in YYYY-MM-DD format and return a Date object
 * Ensures the date is interpreted in local timezone
 * @param dateStr - The date string to parse in YYYY-MM-DD format
 * @returns Date object for the parsed date, or current date if invalid
 */
export function parseDateString(dateStr: string | null | undefined): Date {
  if (hasContent(dateStr)) {
    // Parse the date string in a reliable way that preserves the local timezone
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      // Month is 0-indexed in JavaScript Date
      return new Date(year, month - 1, day);
    }
  }
  // Return current date as fallback
  return new Date();
}
