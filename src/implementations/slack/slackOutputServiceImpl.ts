import { inject, injectable } from 'tsyringe';
import type { SlackShowFormatter } from '../../interfaces/showFormatter.js';
import type { ConfigService } from '../../interfaces/configService.js';
import type { LoggerService } from '../../interfaces/loggerService.js';
import type { SlackClient, SlackBlock } from '../../interfaces/slackClient.js';
import type { Show } from '../../schemas/domain.js';
import { BaseOutputServiceImpl } from '../baseOutputServiceImpl.js';
import { formatDate } from '../../utils/dateUtils.js';
import { formatError, safeResolve } from '../../utils/errorHandling.js';

/**
 * Slack implementation of the OutputService interface
 * Sends TV show information to a Slack channel
 * Extends the BaseOutputServiceImpl abstract class
 */
@injectable()
export class SlackOutputServiceImpl extends BaseOutputServiceImpl<SlackBlock> {
  private readonly slackClient: SlackClient;
  private readonly logger: LoggerService;

  constructor(
    @inject('SlackShowFormatter') formatter: SlackShowFormatter,
    @inject('SlackClient') slackClient: SlackClient,
    @inject('ConfigService') configService: ConfigService,
    @inject('LoggerService') logger?: LoggerService
  ) {
    super(formatter, configService);
    this.slackClient = slackClient;
    this.logger = logger?.child({ module: 'SlackOutputService' }) ?? {
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {},
      child: () => this.logger
    } as LoggerService;
  }

  /**
   * Render the header section
   * For Slack, we combine header and content into a single message,
   * so this method is a no-op. The header is included in renderContent().
   * @param _date The date for which shows are being displayed (unused here)
   */
  protected async renderHeader(_date: Date): Promise<void> {
    // No-op: header is combined with content in renderContent()
    await safeResolve();
  }
  
  /**
   * Render the main content section
   * Combines header and content into a single Slack message
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

    // Create header block with the date
    const dateHeaderBlock: SlackBlock = {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `TV Shows for ${formatDate(date)}`,
        emoji: true
      }
    };

    // Generate content blocks using the formatter
    const contentBlocks = this.showFormatter.formatNetworkGroups(networkGroups);

    // Combine header and content into single message
    const allBlocks = [dateHeaderBlock, ...contentBlocks];

    // Send single message to Slack
    await this.slackClient.sendMessage({
      channel: channelId,
      text: `TV Shows for ${formatDate(date)}`,
      blocks: allBlocks
    });
  }
  
  /**
   * Render the footer section
   */
  protected async renderFooter(): Promise<void> {
    // Footer is handled in the renderContent method for Slack
    await safeResolve();
  }
  
  // Debug information is now handled via structured logging (LoggerService.debug)
  // Use LOG_LEVEL=debug to see detailed debug information
  
  /**
   * Handle errors that occur during rendering
   * @param error The error that occurred
   */
  protected async handleError(error: unknown): Promise<void> {
    const errorMessage = formatError(error);
    const channelId = this.configService.getSlackOptions().channelId;
    
    // Log the error with structured logging
    this.logger.error({
      error: errorMessage,
      channel: channelId,
      stack: error instanceof Error ? error.stack : undefined
    }, 'Error rendering Slack output');
    
    // Attempt to send error message
    try {
      await this.slackClient.sendMessage({
        channel: channelId,
        text: 'Error fetching TV shows: ' + errorMessage
      });
    } catch (sendError) {
      // If we can't even send the error message, log it with context
      this.logger.error({
        originalError: errorMessage,
        sendError: formatError(sendError),
        channel: channelId
      }, 'Failed to send error message to Slack');
    }
  }
}
