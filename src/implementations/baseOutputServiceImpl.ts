import type { OutputService } from '../interfaces/outputService.js';
import type { ConfigService } from '../interfaces/configService.js';
import type { ShowFormatter } from '../interfaces/showFormatter.js';
import type { Show } from '../schemas/domain.js';
import { groupShowsByNetwork } from '../utils/showUtils.js';
import { formatDate } from '../utils/dateUtils.js';

/**
 * Base abstract class for output services
 * Implements the template method pattern for consistent output workflow
 * 
 * @template TOutput Type of the output produced by the formatter
 */
export abstract class BaseOutputServiceImpl<TOutput> implements OutputService {
  /**
   * Constructor with dependency injection
   * @param showFormatter Formatter for TV show output
   * @param configService Configuration service
   */
  constructor(
    protected readonly showFormatter: ShowFormatter<TOutput>,
    protected readonly configService: ConfigService
  ) {}

  /**
   * Template method pattern for rendering output
   * This method defines the workflow and delegates specific steps to subclasses
   * @param shows List of shows to display
   */
  public async renderOutput(shows: Show[]): Promise<void> {
    try {
      // Get date from ConfigService - standardized approach
      const date = this.configService.getDate();
      const isDebugMode = this.configService.isDebugMode();
      
      // Common preprocessing logic
      const networkGroups = groupShowsByNetwork(shows);
      
      // Debug output if enabled
      if (isDebugMode) {
        await this.renderDebugInfo(shows, date);
      }
      
      // Abstract methods to be implemented by subclasses
      await this.renderHeader(date);
      await this.renderContent(networkGroups, date);
      await this.renderFooter();
    } catch (error) {
      await this.handleError(error);
    }
  }
  
  /**
   * Format a date using the standard application format
   * Utility method for subclasses to use
   * @param date The date to format
   * @returns Formatted date string
   */
  protected formatDate(date: Date): string {
    return formatDate(date);
  }
  
  /**
   * Render the header section
   * @param date The date for which shows are being displayed
   */
  protected abstract renderHeader(date: Date): Promise<void>;
  
  /**
   * Render the main content section
   * @param networkGroups Shows grouped by network
   * @param date The date for which shows are being displayed
   */
  protected abstract renderContent(
    networkGroups: Record<string, Show[]>, 
    date: Date
  ): Promise<void>;
  
  /**
   * Render the footer section
   */
  protected abstract renderFooter(): Promise<void>;
  
  /**
   * Render debug information
   * @param shows List of shows
   * @param date The date for which shows are being displayed
   */
  protected abstract renderDebugInfo(shows: Show[], date: Date): Promise<void>;
  
  /**
   * Handle errors that occur during rendering
   * @param error The error that occurred
   */
  protected abstract handleError(error: unknown): Promise<void>;
}
