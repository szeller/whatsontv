/**
 * Utility functions for testing output formatting
 */

/**
 * Strips ANSI color codes from a string
 * 
 * @param str The string to strip color codes from
 * @returns The string without color codes
 */
export function stripAnsiCodes(str: string): string {
  // This regex matches all ANSI escape sequences
  // Using a string-based approach to avoid lint errors with control characters
  const pattern = String.fromCodePoint(27) + String.raw`\[[0-9;]*[A-Za-z]`;
  return str.replaceAll(new RegExp(pattern, 'g'), '');
}

/**
 * Verifies that the output contains at least one line that matches the expected show format
 * This helps ensure the output is properly formatted regardless of specific content
 * 
 * @param output The output text to check
 * @returns true if at least one line matches the expected format
 */
export function containsFormattedShowLine(output: string): boolean {
  // Strip ANSI color codes first
  const cleanOutput = stripAnsiCodes(output);
  
  // This regex matches the general format of a show line:
  // - Time (HH:MM) or N/A at the beginning of the line
  // - Network/platform name (allowing spaces, parentheses, and other common characters)
  // - Show type (like Scripted, Reality)
  // - Show name
  // - Season/Episode info (S01E01 format)
  const showTypes = '(Scripted|Reality|Documentary|Variety|Game Show|Talk Show|News|Sports)';
  
  // Find lines that start with a time pattern (HH:MM) or N/A followed by spaces
  const timePattern = /^ *((?:\d{2}:\d{2})|(?:N\/A)) +/m;
  const typePattern = new RegExp(String.raw`\s+${showTypes}\s+`, 'm');
  const seasonPattern = / S\d+E\d+ /m;
  
  return (
    timePattern.test(cleanOutput) && 
    typePattern.test(cleanOutput) && 
    seasonPattern.test(cleanOutput)
  );
}

/**
 * Verifies that the output contains at least one network heading
 * 
 * @param output The output text to check
 * @returns true if at least one network heading is found
 */
export function containsNetworkHeading(output: string): boolean {
  // Strip ANSI color codes first
  const cleanOutput = stripAnsiCodes(output);
  
  // Look for network heading patterns like "CBS (US):" followed by a line of dashes
  const lines = cleanOutput.split('\n');
  
  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i].trim();
    const nextLine = lines[i + 1].trim();
    
    // Network headings end with a colon and the next line is all dashes
    if (currentLine.endsWith(':') && /^-+$/.test(nextLine)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Counts the number of network headings in the output
 * 
 * @param output The output text to check
 * @returns The number of network headings found
 */
export function countNetworkHeadings(output: string): number {
  // Strip ANSI color codes first
  const cleanOutput = stripAnsiCodes(output);
  
  const lines = cleanOutput.split('\n');
  let count = 0;
  
  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i].trim();
    const nextLine = lines[i + 1].trim();
    
    // Network headings end with a colon and the next line is all dashes
    if (currentLine.endsWith(':') && /^-+$/.test(nextLine)) {
      count++;
    }
  }
  
  return count;
}
