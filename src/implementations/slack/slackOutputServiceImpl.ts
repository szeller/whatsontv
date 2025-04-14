import { inject, injectable } from 'tsyringe';
import type { SlackShowFormatter } from '../../interfaces/showFormatter.js';
import type { ConfigService } from '../../interfaces/configService.js';
import type { SlackClient, SlackBlock } from '../../interfaces/slackClient.js';
import type { Show } from '../../schemas/domain.js';
import { BaseOutputServiceImpl } from '../baseOutputServiceImpl.js';

/**
 * Slack implementation of the OutputService interface
 * Sends TV show information to a Slack channel
 * Extends the BaseOutputServiceImpl abstract class
 */
@injectable()
export class SlackOutputServiceImpl extends BaseOutputServiceImpl<SlackBlock> {
  private readonly slackClient: SlackClient;

  constructor(
    @inject('SlackShowFormatter') formatter: SlackShowFormatter,
    @inject('SlackClient') slackClient: SlackClient,
    @inject('ConfigService') configService: ConfigService
  ) {
    super(formatter, configService);
    this.slackClient = slackClient;
  }

  /**
   * Render the header section
   * @param _date The date for which shows are being displayed
   */
  protected async renderHeader(_date: Date): Promise<void> {
    // Header is handled in the renderContent method for Slack
    await Promise.resolve();
  }
  
  /**
   * Render the main content section
   * @param networkGroups Shows grouped by network
   * @param date The date for which shows are being displayed
   */
  protected async renderContent(
    networkGroups: Record<string, Show[]>, 
    date: Date
  ): Promise<void> {
    // Get Slack configuration options
    const slackOptions = this.configService.getSlackOptions();
    const channelId = slackOptions.channelId;
    
    // Generate Slack blocks using the formatter
    const blocks = this.showFormatter.formatNetworkGroups(networkGroups);
    
    // Send to Slack
    await this.slackClient.sendMessage({
      channel: channelId,
      text: `TV Shows for ${this.formatDate(date)}`,
      blocks
    });
  }
  
  /**
   * Render the footer section
   */
  protected async renderFooter(): Promise<void> {
    // Footer is handled in the renderContent method for Slack
    await Promise.resolve();
  }
  
  /**
   * Render debug information
   * @param shows List of shows
   * @param _date The date for which shows are being displayed
   */
  protected async renderDebugInfo(shows: Show[], _date: Date): Promise<void> {
    const uniqueNetworks = new Set<string>();
    for (const show of shows) {
      if (show.network && typeof show.network === 'string') {
        uniqueNetworks.add(show.network);
      }
    }
    
    const debugText = [
      '*Debug Information:*',
      `Date queried: ${this.formatDate(_date)}`,
      `Available Networks: ${[...uniqueNetworks].sort().join(', ')}`,
      `Total Shows: ${shows.length}`
    ].join('\n');
    
    try {
      await this.slackClient.sendMessage({
        channel: this.configService.getSlackOptions().channelId,
        text: debugText
      });
    } catch (error) {
      console.error('Failed to send debug info to Slack:', 
        error instanceof Error ? error.message : String(error));
    }
  }
  
  /**
   * Handle errors that occur during rendering
   * @param error The error that occurred
   */
  protected async handleError(error: unknown): Promise<void> {
    // Log the error
    console.error('Error rendering Slack output:', 
      error instanceof Error ? error.message : String(error));
    
    // Attempt to send error message
    try {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
        
      await this.slackClient.sendMessage({
        channel: this.configService.getSlackOptions().channelId,
        text: 'Error fetching TV shows: ' + errorMessage
      });
    } catch (sendError) {
      // If we can't even send the error message, just log it
      console.error('Failed to send error message to Slack:', 
        sendError instanceof Error ? sendError.message : String(sendError));
    }
  }
}
