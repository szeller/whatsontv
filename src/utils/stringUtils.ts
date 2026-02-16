/**
 * String utility functions for the application
 */

/**
 * Check if a string is null, undefined, or empty
 * @param value - The value to check
 * @param trim - Whether to trim whitespace before checking (default: false)
 * @returns True if the value is null, undefined, or empty string
 */
export function isEmptyString(value: string | null | undefined, trim = false): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  return trim ? value.trim() === '' : value === '';
}

/**
 * Check if a string has content (type guard that narrows to string)
 * @param value - The value to check
 * @returns True if value is a non-empty string
 */
export function hasContent(value: string | null | undefined): value is string {
  return value !== null && value !== undefined && value !== '';
}

/**
 * Check if an array is null, undefined, or empty
 * @param arr - The array to check
 * @returns True if the array is null, undefined, or has no elements
 */
export function isEmptyArray<T>(arr: T[] | null | undefined): boolean {
  return arr === null || arr === undefined || arr.length === 0;
}

/**
 * Check if an array has elements (type guard that narrows to T[])
 * @param arr - The array to check
 * @returns True if the array has one or more elements
 */
export function hasElements<T>(arr: T[] | null | undefined): arr is T[] {
  return arr !== null && arr !== undefined && arr.length > 0;
}

/**
 * Get a string value or a default if empty/null/undefined
 * @param value - The string to check
 * @param defaultValue - The default value to use
 * @returns The input value if valid, or the default value
 */
export function getStringOrDefault(value: string | null | undefined, defaultValue: string): string {
  // Check for null/undefined/empty first, then check trimmed
  if (value === null || value === undefined || value.trim() === '') {
    return defaultValue;
  }
  return value.trim();
}

/**
 * Get a string value or a default if empty/null/undefined
 * This is an enhanced version of getStringOrDefault that handles more cases
 * @param value - The string to check
 * @param defaultValue - The default value to use
 * @returns The input value if valid, or the default value
 */
export function getStringValue(
  value: string | null | undefined,
  defaultValue = ''
): string {
  return hasContent(value) ? value : defaultValue;
}

/**
 * Pad a string to a specific length with a character
 * @param str - String to pad
 * @param length - Desired length
 * @param padChar - Character to use for padding (default: space)
 * @returns Padded string
 */
export function padString(
  str: string | null | undefined, 
  length: number, 
  padChar = ' '
): string {
  const value = str !== null && str !== undefined ? String(str) : '';
  return value.padEnd(length, padChar);
}

/**
 * Truncate a string to a maximum length with a suffix
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add if truncated (default: '...')
 * @returns Truncated string
 */
export function truncateString(
  str: string | null | undefined, 
  maxLength: number, 
  suffix = '...'
): string {
  const value = str !== null && str !== undefined ? String(str) : '';
  
  if (value.length <= maxLength) {
    return value;
  }
  
  // Ensure there's room for the suffix
  const truncatedLength = maxLength - suffix.length;
  if (truncatedLength <= 0) {
    return suffix.substring(0, maxLength);
  }
  
  return value.substring(0, truncatedLength) + suffix;
}

/**
 * Format a list of items with a separator
 * @param items - List of items to format
 * @param separator - Separator to use (default: ', ')
 * @returns Formatted string
 */
export function formatListWithSeparator(items: string[], separator = ', '): string {
  if (isEmptyArray(items)) {
    return '';
  }

  // Filter out empty items
  const filteredItems = items.filter(item => !isEmptyString(item));

  if (isEmptyArray(filteredItems)) {
    return '';
  }

  return filteredItems.join(separator);
}

/**
 * Wrap text to fit within a specified width
 * @param text - Text to wrap
 * @param maxWidth - Maximum width for each line
 * @returns Array of wrapped lines
 */
export function wrapText(text: string, maxWidth: number): string[] {
  if (!text || maxWidth <= 0) {
    return [];
  }
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    // Check if adding this word would exceed the max width
    if (currentLine.length + word.length + 1 > maxWidth) {
      // If the current line is not empty, add it to the lines array
      if (currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = '';
      }
      
      // If the word itself is longer than maxWidth, split it
      if (word.length > maxWidth) {
        let remainingWord = word;
        while (remainingWord.length > 0) {
          const chunk = remainingWord.substring(0, maxWidth);
          lines.push(chunk);
          remainingWord = remainingWord.substring(maxWidth);
        }
      } else {
        currentLine = word;
      }
    } else {
      // Add the word to the current line
      if (currentLine.length > 0) {
        currentLine += ' ';
      }
      currentLine += word;
    }
  }
  
  // Add the last line if it's not empty
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Create a separator line with consistent length
 * @param length - Length of the separator line
 * @param char - Character to use for the separator
 * @returns Formatted separator string
 */
export function createSeparator(length = 30, char = '='): string {
  return padString('', length, char);
}
