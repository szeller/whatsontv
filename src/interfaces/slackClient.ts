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
}

/**
 * Slack Text Object
 */
export interface SlackTextObject {
  type: 'plain_text' | 'mrkdwn';
  text: string;
  emoji?: boolean;
  verbatim?: boolean;
}

/**
 * Slack Image Element
 */
export interface SlackImageElement {
  type: 'image';
  image_url: string;
  alt_text: string;
}

/**
 * Slack Section Block
 */
export interface SlackSectionBlock {
  type: 'section';
  block_id?: string;
  text: SlackTextObject;
  fields?: SlackTextObject[];
  accessory?: SlackImageElement;
}

/**
 * Slack Header Block
 */
export interface SlackHeaderBlock {
  type: 'header';
  block_id?: string;
  text: SlackTextObject;
}

/**
 * Slack Divider Block
 */
export interface SlackDividerBlock {
  type: 'divider';
  block_id?: string;
}

/**
 * Slack Context Block
 */
export interface SlackContextBlock {
  type: 'context';
  block_id?: string;
  elements: (SlackTextObject | SlackImageElement)[];
}

/**
 * Union type of all Slack blocks we use in the application
 */
export type SlackBlock = 
  | SlackSectionBlock 
  | SlackHeaderBlock 
  | SlackDividerBlock 
  | SlackContextBlock;

/**
 * Type guard to check if a block is a section block
 */
export function isSectionBlock(block?: SlackBlock): boolean {
  return block?.type === 'section';
}

/**
 * Type guard to check if a block is a header block
 */
export function isHeaderBlock(block?: SlackBlock): boolean {
  return block?.type === 'header';
}
