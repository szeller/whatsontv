import { inject, injectable } from 'tsyringe';
import type { SlackShowFormatter } from '../../interfaces/showFormatter.js';
import type { ConfigService } from '../../interfaces/configService.js';
import type { SlackClient, SlackBlock } from '../../interfaces/slackClient.js';
import type { Show } from '../../schemas/domain.js';
import { BaseOutputServiceImpl } from '../baseOutputServiceImpl.js';
import { formatDate } from '../../utils/dateUtils.js';
import { formatError, generateDebugInfo, safeResolve } from '../../utils/errorHandling.js';

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
   * @param date The date for which shows are being displayed
   */
  protected async renderHeader(date: Date): Promise<void> {
    // Get Slack configuration options
    const slackOptions = this.configService.getSlackOptions();
    const channelId = slackOptions.channelId;
    
    // Create a header block with the date
    const dateHeaderBlock: SlackBlock = {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `📺 TV Shows for ${formatDate(date)}`,
        emoji: true
      }
    };
    
    // Send the header to Slack
    await this.slackClient.sendMessage({
      channel: channelId,
      text: `TV Shows for ${formatDate(date)}`,
      blocks: [dateHeaderBlock]
    });
  }
  
  /**
   * Render the main content section
   * @param networkGroups Shows grouped by network
   * @param _date The date for which shows are being displayed (unused)
   */
  protected async renderContent(
    networkGroups: Record<string, Show[]>, 
    _date: Date
  ): Promise<void> {
    // Get Slack configuration options
    const slackOptions = this.configService.getSlackOptions();
    const channelId = slackOptions.channelId;
    
    // Generate Slack blocks using the formatter
    const blocks = this.showFormatter.formatNetworkGroups(networkGroups);
    
    // Send to Slack
    await this.slackClient.sendMessage({
      channel: channelId,
      text: 'TV Shows by Network',
      blocks
    });
  }
  
  /**
   * Render the footer section
   */
  protected async renderFooter(): Promise<void> {
    // Footer is handled in the renderContent method for Slack
    await safeResolve();
  }
  
  /**
   * Render debug information
   * @param shows List of shows
   * @param _date The date for which shows are being displayed
   */
  protected async renderDebugInfo(shows: Show[], date: Date): Promise<void> {
    const debugInfo = generateDebugInfo(shows, date);
    
    const debugText = [
      '*Debug Information:*',
      `Date queried: ${debugInfo.dateFormatted}`,
      `Available Networks: ${debugInfo.networks.join(', ')}`,
      `Total Shows: ${debugInfo.totalShows}`
    ].join('\n');
    
    try {
      await this.slackClient.sendMessage({
        channel: this.configService.getSlackOptions().channelId,
        text: debugText
      });
    } catch (error) {
      console.error('Failed to send debug info to Slack:', formatError(error));
    }
  }
  
  /**
   * Handle errors that occur during rendering
   * @param error The error that occurred
   */
  protected async handleError(error: unknown): Promise<void> {
    // Log the error
    console.error('Error rendering Slack output:', formatError(error));
    
    // Attempt to send error message
    try {
      await this.slackClient.sendMessage({
        channel: this.configService.getSlackOptions().channelId,
        text: 'Error fetching TV shows: ' + formatError(error)
      });
    } catch (sendError) {
      // If we can't even send the error message, just log it
      console.error('Failed to send error message to Slack:', formatError(sendError));
    }
  }
}
