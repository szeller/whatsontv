import { inject, injectable } from 'tsyringe';
import type { OutputService } from '../../interfaces/outputService.js';
import type { SlackShowFormatter } from '../../interfaces/showFormatter.js';
import type { ConfigService } from '../../interfaces/configService.js';
import type { SlackClient } from '../../interfaces/slackClient.js';
import type { Show } from '../../schemas/domain.js';
import { groupShowsByNetwork } from '../../utils/showUtils.js';

/**
 * Slack implementation of the OutputService interface
 * Sends TV show information to a Slack channel
 */
@injectable()
export class SlackOutputServiceImpl implements OutputService {
  constructor(
    @inject('SlackFormatter') private formatter: SlackShowFormatter,
    @inject('SlackClient') private slackClient: SlackClient,
    @inject('ConfigService') private configService: ConfigService
  ) {}

  /**
   * Execute the complete output workflow for Slack
   * @param shows The TV shows to display
   */
  public async renderOutput(shows: Show[]): Promise<void> {
    try {
      // Get Slack configuration options
      const slackOptions = this.configService.getSlackOptions();
      const channelId = slackOptions.channelId;
      
      // Group shows by network
      const networkGroups = groupShowsByNetwork(shows);
      
      // Generate Slack blocks using the formatter
      const blocks = this.formatter.formatNetworkGroups(networkGroups);
      
      // Send to Slack
      await this.slackClient.sendMessage({
        channel: channelId,
        text: `TV Shows for ${new Date().toLocaleDateString()}`,
        blocks
      });
    } catch (error) {
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
          text: `Error fetching TV shows: ${errorMessage}`
        });
      } catch (sendError) {
        // If we can't even send the error message, just log it
        console.error('Failed to send error message to Slack:', 
          sendError instanceof Error ? sendError.message : String(sendError));
      }
    }
  }
}
