/**
 * StyleService - Interface for text styling operations
 * Abstracts styling logic to improve testability
 */

import 'reflect-metadata';
import chalk from 'chalk';
import { container, injectable } from 'tsyringe';

/**
 * Interface defining text styling operations
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

/**
 * Production implementation using chalk
 */
@injectable()
export class ChalkStyleService implements StyleService {
  // Basic styling
  bold(text: string): string {
    return chalk.bold(text);
  }
  
  dim(text: string): string {
    return chalk.dim(text);
  }
  
  // Colors
  green(text: string): string {
    return chalk.green(text);
  }
  
  yellow(text: string): string {
    return chalk.yellow(text);
  }
  
  blue(text: string): string {
    return chalk.blue(text);
  }
  
  magenta(text: string): string {
    return chalk.magenta(text);
  }
  
  cyan(text: string): string {
    return chalk.cyan(text);
  }
  
  red(text: string): string {
    return chalk.red(text);
  }
  
  // Combined styles
  boldGreen(text: string): string {
    return chalk.bold.green(text);
  }
  
  boldYellow(text: string): string {
    return chalk.bold.yellow(text);
  }
  
  boldBlue(text: string): string {
    return chalk.bold.blue(text);
  }
  
  boldMagenta(text: string): string {
    return chalk.bold.magenta(text);
  }
  
  boldCyan(text: string): string {
    return chalk.bold.cyan(text);
  }
  
  boldRed(text: string): string {
    return chalk.bold.red(text);
  }
}

/**
 * Plain implementation for testing
 * Returns text without styling for easier assertions
 */
@injectable()
export class PlainStyleService implements StyleService {
  // Basic styling
  bold(text: string): string {
    return text;
  }
  
  dim(text: string): string {
    return text;
  }
  
  // Colors
  green(text: string): string {
    return text;
  }
  
  yellow(text: string): string {
    return text;
  }
  
  blue(text: string): string {
    return text;
  }
  
  magenta(text: string): string {
    return text;
  }
  
  cyan(text: string): string {
    return text;
  }
  
  red(text: string): string {
    return text;
  }
  
  // Combined styles
  boldGreen(text: string): string {
    return text;
  }
  
  boldYellow(text: string): string {
    return text;
  }
  
  boldBlue(text: string): string {
    return text;
  }
  
  boldMagenta(text: string): string {
    return text;
  }
  
  boldCyan(text: string): string {
    return text;
  }
  
  boldRed(text: string): string {
    return text;
  }
}

// Register default implementations
container.register<StyleService>('StyleService', {
  useClass: ChalkStyleService
});

// Export a default instance for convenience
export const styleService = container.resolve<StyleService>('StyleService');
