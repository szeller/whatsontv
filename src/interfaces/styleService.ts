/**
 * StyleService - Interface for text styling operations
 * Abstracts styling logic to improve testability
 */

export interface StyleService {
  // Basic styling
  bold(text: string): string;
  dim(text: string): string;
  
  // Colors
  green(text: string): string;
  yellow(text: string): string;
  blue(text: string): string;
  magenta(text: string): string;
  cyan(text: string): string;
  red(text: string): string;
  
  // Combined styles
  boldGreen(text: string): string;
  boldYellow(text: string): string;
  boldBlue(text: string): string;
  boldMagenta(text: string): string;
  boldCyan(text: string): string;
  boldRed(text: string): string;
}
