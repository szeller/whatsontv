import { WebClient } from '@slack/web-api';
import { injectable, inject } from 'tsyringe';
import type { ConfigService } from '../../interfaces/configService.js';
import type { LoggerService } from '../../interfaces/loggerService.js';
import type { SlackClient, SlackMessagePayload } from '../../interfaces/slackClient.js';
import type { SlackConfig } from '../../types/configTypes.js';

/**
 * Implementation of the SlackClient interface
 * Handles sending messages to Slack using the Slack Web API
 */
@injectable()
export class SlackClientImpl implements SlackClient {
  private _client: WebClient;
  private _options: SlackConfig;
  private readonly logger: LoggerService;

  /**
   * Creates a new SlackClientImpl instance
   * @param configService The configuration service
   * @param webClientFactory Optional factory function for creating WebClient instances
   * @param logger The logger service
   */
  constructor(
    @inject('ConfigService') private readonly configService: ConfigService,
    @inject('WebClientFactory') 
    private readonly webClientFactory: ((config: SlackConfig) => WebClient) | undefined,
    @inject('LoggerService') logger?: LoggerService
  ) {
    this._options = this.configService.getSlackOptions();
    this.logger = logger?.child({ module: 'SlackClient' }) ?? {
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {},
      child: () => this.logger
    } as LoggerService;
    
    // Use the factory if provided, otherwise create a new WebClient directly
    if (this.webClientFactory) {
      this._client = this.webClientFactory(this._options);
    } else {
      this._client = new WebClient(this._options.token);
    }
  }

  /**
   * Send a message to Slack
   * @param payload The message payload to send
   * @returns Promise resolving when the message is sent
   */
  public async sendMessage(payload: SlackMessagePayload): Promise<void> {
    const startTime = Date.now();
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
      const result = await this._client.chat.postMessage(completePayload);
      
      if (!result.ok) {
        throw new Error(`Slack API returned error: ${result.error}`);
      }
      
      // Log successful message sending
      this.logger.info({
        channel: payload.channel,
        messageLength: payload.text?.length ?? 0,
        hasBlocks: payload.blocks !== undefined,
        blocksCount: payload.blocks?.length ?? 0,
        duration: Date.now() - startTime,
        timestamp: result.ts
      }, 'Successfully sent Slack message');
    } catch (error) {
      this.logger.error({
        error: String(error),
        channel: payload.channel,
        messageLength: payload.text?.length ?? 0,
        hasBlocks: payload.blocks !== undefined,
        blocksCount: payload.blocks?.length ?? 0,
        duration: Date.now() - startTime,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Failed to send Slack message');
      throw new Error(`Failed to send Slack message: ${String(error)}`);
    }
  }
}
