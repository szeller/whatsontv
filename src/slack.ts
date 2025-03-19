import { WebClient } from '@slack/web-api';
import schedule from 'node-schedule';

import config from './config.js';
import { fetchTvShows, getTodayDate } from './services/tvShowService.js';
import type { Show } from './types/tvmaze.js';
import { consoleOutput } from './utils/console.js';

interface SlackMessage {
  channel: string;
  text: string;
  blocks?: MessageBlock[];
}

interface MessageBlock {
  type: string;
  text: {
    type: string;
    text: string;
  };
}

// Initialize Slack client if enabled
let slack: WebClient | undefined;
if (
  config.slack.enabled === true && 
  config.slack.botToken !== undefined && 
  config.slack.botToken !== ''
) {
  slack = new WebClient(config.slack.botToken);
}

/**
 * Send TV show notifications to Slack
 * @param timeSort Whether to sort shows by time
 * @returns Promise that resolves when notifications are sent
 */
export async function sendTvShowNotifications(timeSort = false): Promise<void> {
  try {
    if (slack === undefined) {
      throw new Error('Slack client not initialized. Check your configuration.');
    }

    if (config.slack.channel === undefined || config.slack.channel === '') {
      throw new Error('Slack channel not configured.');
    }

    const shows: Show[] = await fetchTvShows({
      types: config.types,
      networks: config.networks,
      genres: config.genres,
      languages: config.languages,
      date: getTodayDate()
    });

    let message = '';
    let blocks: MessageBlock[] = [];

    if (shows.length === 0) {
      message = ' No TV shows found for today.';
      blocks = [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message
        }
      }];
    } else {
      message = '*TV Shows Today:*\n\n';

      // Group shows by network
      const networkGroups: Record<string, Show[]> = groupShowsByNetwork(shows);
      const messageBlocks: MessageBlock[] = Object.entries(networkGroups)
        .sort(([a], [b]): number => a.localeCompare(b))
        .map(([network, shows]: [string, Show[]]): MessageBlock => {
          const formattedShows: string = shows
            .sort((a: Show, b: Show): number => {
              if (timeSort) {
                return (a.airtime || '').localeCompare(b.airtime || '');
              }
              return a.show.name.localeCompare(b.show.name);
            })
            .map((show: Show): string => formatShowDetails(show))
            .join('\n');

          return {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${network}*\n${formattedShows}`
            }
          };
        });

      // Format shows by network
      messageBlocks.forEach((block: MessageBlock): void => {
        message += block.text.text + '\n\n';
      });

      blocks = messageBlocks;
    }

    const slackMessage: SlackMessage = {
      channel: config.slack.channel,
      text: message,
      blocks
    };

    await slack.chat.postMessage(slackMessage);
    consoleOutput.log('TV show notifications sent successfully.');
  } catch (error) {
    consoleOutput.error('Failed to send TV show notifications:', error);
    throw error;
  }
}

/**
 * Start the TV show notification service
 */
export function startTvShowNotifier(): void {
  const cronSchedule = `0 ${config.notificationTime.split(':')[1]} ${
    config.notificationTime.split(':')[0]
  } * * *`;

  const dailyTvShowCheck = async (): Promise<void> => {
    try {
      await sendTvShowNotifications();
    } catch (error) {
      consoleOutput.error('Failed to run daily TV show check:', error);
    }
  };

  schedule.scheduleJob(cronSchedule, dailyTvShowCheck);
  consoleOutput.log(`TV Show Notifier is running. Scheduled for ${config.notificationTime} daily.`);
}

/**
 * Group shows by their network or web channel
 * @param shows List of shows to group
 * @returns Shows grouped by network
 */
function groupShowsByNetwork(shows: Show[]): Record<string, Show[]> {
  return shows.reduce<Record<string, Show[]>>((acc, show) => {
    const network: string = (
      show.show.network?.name !== undefined && show.show.network.name !== ''
    ) ? show.show.network.name : (
        show.show.webChannel?.name !== undefined && show.show.webChannel.name !== ''
      ) ? show.show.webChannel.name : 'N/A';
    
    if (acc[network] === undefined) {
      acc[network] = [];
    }
    acc[network].push(show);
    return acc;
  }, {} as Record<string, Show[]>);
}

/**
 * Format show details for display
 * @param show Show to format
 * @returns Formatted show details
 */
function formatShowDetails(show: Show): string {
  const time: string = show.airtime || 'TBA';
  const episodeInfo: string = `S${show.season}E${show.number}`;
  return `• \`${time}\` *${show.show.name}* (${show.show.type || 'Unknown'}) - ${episodeInfo}\n` +
    (show.name ? `  "${show.name}"\n` : '');
}

// Check if running in test mode
if (process.argv.includes('--test')) {
  // Just run once and exit
  void sendTvShowNotifications().then(() => process.exit(0));
} else {
  startTvShowNotifier();
}
