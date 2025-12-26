import 'reflect-metadata';
import chalk from 'chalk';
import { injectable } from 'tsyringe';

import type { StyleService } from '../../interfaces/styleService.js';

/**
 * Production implementation of StyleService using chalk
 */
@injectable()
export class ChalkStyleServiceImpl implements StyleService {
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
