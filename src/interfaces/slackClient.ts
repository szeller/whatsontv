/**
 * Interface for a client that can send messages to Slack
 */
export interface SlackClient {
  /**
   * Send a message to Slack
   * @param payload The message payload to send
   * @returns Promise resolving when the message is sent
   */
  sendMessage(payload: SlackMessagePayload): Promise<void>;
}

/**
 * Slack Message Payload
 */
export interface SlackMessagePayload {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
  username?: string;
  icon_emoji?: string;
  [key: string]: unknown;
}

/**
 * Slack Block
 */
export interface SlackBlock {
  type: string;
  [key: string]: unknown;
}
