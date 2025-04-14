import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';

import type { ConfigService } from '../../interfaces/configService.js';
import type { TextShowFormatter } from '../../interfaces/showFormatter.js';
import type { Show } from '../../schemas/domain.js';
import type { ConsoleOutput } from '../../interfaces/consoleOutput.js';
import { BaseOutputServiceImpl } from '../baseOutputServiceImpl.js';
import { padString } from '../../utils/stringUtils.js';
import { formatDate } from '../../utils/dateUtils.js';
import { formatError, generateDebugInfo, safeResolve } from '../../utils/errorHandling.js';

/**
 * Console output service for displaying TV show information
 * Extends the BaseOutputServiceImpl abstract class
 */
@injectable()
export class ConsoleOutputServiceImpl extends BaseOutputServiceImpl<string> {
  protected readonly output: ConsoleOutput;
  private readonly version = '1.0.0'; // Could be imported from package.json
  
  /**
   * Create a new ConsoleOutputService
   * @param formatter Formatter for TV show output
   * @param output Console output utility
   * @param configService Configuration service
   */
  constructor(
    @inject('TextShowFormatter') formatter: TextShowFormatter,
    @inject('ConsoleOutput') output: ConsoleOutput,
    @inject('ConfigService') configService: ConfigService
  ) {
    super(formatter, configService);
    this.output = output;
  }

  /**
   * Render the header section
   * @param date The date for which shows are being displayed
   */
  protected async renderHeader(date: Date): Promise<void> {
    await safeResolve();
    
    // Create a header with app name and version
    const appHeader = `WhatsOnTV v${this.version}`;
    const separator = this.createSeparator();
    
    // Display header with date
    this.output.log('');
    this.output.log(appHeader);
    this.output.log(separator);
    this.output.log(`Shows for ${formatDate(date)}`);
    this.output.log('');
  }
  
  /**
   * Render the main content section
   * @param networkGroups Shows grouped by network
   * @param date The date for which shows are being displayed
   */
  protected async renderContent(
    networkGroups: Record<string, Show[]>, 
    _date: Date // Prefix with underscore to indicate it's not used
  ): Promise<void> {
    await safeResolve();
    
    if (Object.keys(networkGroups).length === 0) {
      this.output.log('No shows found for the specified criteria.');
      return;
    }
    
    try {
      // Format the shows using the formatter
      const formattedOutput = this.showFormatter.formatNetworkGroups(networkGroups);
      
      // Display each line of output
      for (const line of formattedOutput) {
        this.output.log(line);
      }
    } catch (error) {
      this.output.error(formatError(error, 'Error: '));
    }
  }
  
  /**
   * Render the footer section
   */
  protected async renderFooter(): Promise<void> {
    await safeResolve();
    
    const separator = this.createSeparator();
    
    // Display footer
    this.output.log('');
    this.output.log(separator);
    this.output.log('Data provided by TVMaze API (https://api.tvmaze.com)');
  }
  
  /**
   * Render debug information
   * @param shows List of shows
   * @param date The date for which shows are being displayed
   */
  protected async renderDebugInfo(shows: Show[], date: Date): Promise<void> {
    await safeResolve();
    
    const debugInfo = generateDebugInfo(shows, date);
    
    this.output.log('\nDebug Information:');
    this.output.log(`Date queried: ${debugInfo.dateFormatted}`);
    this.output.log('\nAvailable Networks:');
    this.output.log(debugInfo.networks.join(', '));
    this.output.log(`\nTotal Shows: ${debugInfo.totalShows}`);
  }
  
  /**
   * Handle errors that occur during rendering
   * @param error The error that occurred
   */
  protected async handleError(error: unknown): Promise<void> {
    await safeResolve();
    
    this.output.error(formatError(error, 'Error: '));
  }
  
  /**
   * Create a separator line with consistent length
   * @returns Formatted separator string
   * @private
   */
  private createSeparator(length = 30, char = '='): string {
    return padString('', length, char);
  }
}
