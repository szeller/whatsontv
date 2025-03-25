/**
 * Slack integration for WhatsOnTV
 * Sends TV show information to Slack
 */
import { WebClient } from '@slack/web-api';
import { getTodayDate } from './utils/dateUtils.js';
import config from './config.js';
import { groupShowsByNetwork } from './utils/showUtils.js';
import type { ConsoleOutput } from './interfaces/consoleOutput.js';
import type { TvShowService } from './interfaces/tvShowService.js';
import type { Show } from './types/tvShowModel.js';

/**
 * Slack block types
 */
interface SlackBlock {
  type: string;
  text?: { type: string; text: string };
}

/**
 * Slack configuration
 */
export interface SlackConfig {
  botToken: string;
  channel: string;
}

/**
 * Send TV show information to Slack
 * @param service TV show service
 * @param output Console output service
 */
export async function sendToSlack(
  service: TvShowService,
  output: ConsoleOutput
): Promise<void> {
  // Check if Slack is configured
  if (
    typeof config.slack !== 'object' || 
    config.slack === null ||
    typeof config.slack.botToken !== 'string' || 
    config.slack.botToken === '' ||
    typeof config.slack.channel !== 'string' ||
    config.slack.channel === ''
  ) {
    output.log(
      'Slack is not configured. Please set SLACK_BOT_TOKEN and SLACK_CHANNEL environment variables.'
    );
    return;
  }

  const slackConfig: SlackConfig = {
    botToken: config.slack.botToken,
    channel: config.slack.channel
  };

  // Get shows for today
  const shows = await service.fetchShows({
    date: getTodayDate()
  });
  
  if (shows.length === 0) {
    output.log('No shows found for today.');
    return;
  }

  await postToSlack(shows, slackConfig, output);
}

/**
 * Post shows to Slack
 * @param shows Shows to post
 * @param config Slack configuration
 * @param output Console output service
 */
async function postToSlack(
  shows: Show[],
  config: SlackConfig,
  output: ConsoleOutput
): Promise<void> {
  try {
    const client = new WebClient(config.botToken);

    // Create message blocks
    const blocks = createMessageBlocks(shows);

    // Send message to Slack
    const result = await client.chat.postMessage({
      channel: config.channel,
      text: 'TV Shows Today',
      blocks
    });

    output.log(`Message sent to Slack: ${result.ts}`);
  } catch (error) {
    output.error('Error sending message to Slack:');
    if (error instanceof Error) {
      output.error(error.message);
      return;
    }
    output.error(String(error));
  }
}

/**
 * Create message blocks for Slack
 * @param shows Shows to create blocks for
 * @returns Message blocks
 */
function createMessageBlocks(shows: Show[]): SlackBlock[] {
  // Create message blocks
  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `*TV Shows for ${getTodayDate()}*`
      }
    }
  ];

  // Group shows by network
  const networkGroups = groupShowsByNetwork(shows);
  
  // Add each network as a section
  for (const [network, networkShows] of Object.entries(networkGroups)) {
    if (networkShows.length === 0) {
      continue;
    }

    // Add network header
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${network}*`
      }
    });

    // Add shows for this network
    const formattedShows: string = networkShows
      .sort((a: Show, b: Show): number => {
        // Always sort by time
        const aTime = a.airtime !== null && a.airtime !== '' ? a.airtime : '';
        const bTime = b.airtime !== null && b.airtime !== '' ? b.airtime : '';
        return aTime.localeCompare(bTime);
      })
      .map((show: Show): string => formatShowDetails(show))
      .join('\n');

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: formattedShows
      }
    });

    // Add divider
    blocks.push({
      type: 'divider'
    });
  }

  return blocks;
}

/**
 * Format show details for Slack
 * @param show Show to format
 * @returns Formatted string
 */
function formatShowDetails(show: Show): string {
  // Format time
  const time = show.airtime !== null && show.airtime !== '' ? show.airtime : 'TBA';
  
  // Format episode info
  const episodeInfo = 
    (typeof show.season === 'number' && show.season > 0) && 
    (typeof show.number === 'number' && show.number > 0)
      ? `S${show.season}E${show.number}` 
      : '';
  
  // Return formatted string
  return `• \`${time}\` *${show.name}* (${show.type || 'Unknown'}) - ${episodeInfo}`;
}
