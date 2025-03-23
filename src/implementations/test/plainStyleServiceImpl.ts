import 'reflect-metadata';
import { injectable } from 'tsyringe';

import type { StyleService } from '../../interfaces/styleService.js';

/**
 * Plain implementation of StyleService for testing
 * Returns text without styling for easier assertions
 */
@injectable()
export class PlainStyleServiceImpl implements StyleService {
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
