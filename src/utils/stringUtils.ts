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

/**
 * Get a string value or a default if empty/null/undefined
 * This is an enhanced version of getStringOrDefault that handles more cases
 * @param value - The string to check
 * @param defaultValue - The default value to use
 * @returns The input value if valid, or the default value
 */
export function getStringValue(value: string | null | undefined, defaultValue: string): string {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  return value;
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
  padChar: string = ' '
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
  suffix: string = '...'
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
export function formatListWithSeparator(items: string[], separator: string = ', '): string {
  if (items === undefined || items === null || items.length === 0) {
    return '';
  }
  
  // Filter out empty items
  const filteredItems = items.filter(item => item !== null && item !== undefined && item !== '');
  
  if (filteredItems.length === 0) {
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
