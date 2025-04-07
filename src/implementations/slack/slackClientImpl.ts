import { inject, injectable } from 'tsyringe';
import { WebClient } from '@slack/web-api';
import type { SlackClient, SlackMessagePayload } from '../../interfaces/slackClient.js';
import type { ConfigService } from '../../interfaces/configService.js';

/**
 * Configuration options for Slack
 */
export interface SlackOptions {
  token: string;
  channelId: string;
  username: string;
  icon_emoji?: string;
  dateFormat?: string;
}

/**
 * Implementation of the SlackClient interface
 * Handles sending messages to Slack using the Slack Web API
 */
@injectable()
export class SlackClientImpl implements SlackClient {
  private _client: WebClient;
  private _options: SlackOptions;

  constructor(
    @inject('ConfigService') private readonly configService: ConfigService
  ) {
    this._options = this.configService.getSlackOptions();
    this._client = new WebClient(this._options.token);
  }

  /**
   * Send a message to Slack
   * @param payload The message payload to send
   * @returns Promise resolving when the message is sent
   */
  public async sendMessage(payload: SlackMessagePayload): Promise<void> {
    try {
      // Ensure channel is set
      if (payload.channel === undefined || payload.channel === null || payload.channel === '') {
        payload.channel = this._options.channelId;
      }

      // Add default username if set in options
      const completePayload = {
        ...payload,
        username: payload.username !== undefined && payload.username !== null 
          && payload.username !== ''
          ? payload.username
          : this._options.username,
        icon_emoji: payload.icon_emoji !== undefined && payload.icon_emoji !== null 
          && payload.icon_emoji !== ''
          ? payload.icon_emoji
          : this._options.icon_emoji
      };

      // Send the message
      await this._client.chat.postMessage(completePayload);
    } catch (error) {
      console.error('Error sending Slack message:', error);
      throw new Error(`Failed to send Slack message: ${String(error)}`);
    }
  }
}
