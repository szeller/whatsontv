import { WebClient } from '@slack/web-api';
import schedule from 'node-schedule';
import { container } from './container.js';

import config from './config.js';
import type { ConsoleOutput } from './interfaces/consoleOutput.js';
import type { TvShowService } from './interfaces/tvShowService.js';
import type { Show } from './types/tvmaze.js';
import { getTodayDate } from './utils/showUtils.js';

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
  const consoleOutput = container.resolve<ConsoleOutput>('ConsoleOutput');
  
  try {
    if (slack === undefined) {
      throw new Error('Slack client not initialized. Check your configuration.');
    }

    if (config.slack.channel === undefined || config.slack.channel === '') {
      throw new Error('Slack channel not configured.');
    }

    const tvShowService = container.resolve<TvShowService>('TvShowService');
    const shows: Show[] = await tvShowService.fetchShowsWithOptions({
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
      // Group shows by network
      const networkGroups = groupShowsByNetwork(shows);
      
      // Format and send the message
      blocks = [];
      
      // Add header
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*TV Shows for ${getTodayDate()}*`
        }
      });

      // Format shows by network
      for (const [network, shows] of Object.entries(networkGroups)) {
        const formattedShows: string = shows
          .sort((a: Show, b: Show): number => {
            if (timeSort) {
              return (a.airtime || '').localeCompare(b.airtime || '');
            }
            return a.show.name.localeCompare(b.show.name);
          })
          .map((show: Show): string => formatShowDetails(show))
          .join('\n');

        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${network}*\n${formattedShows}`
          }
        });
      }

      // Format shows by network
      for (const block of blocks) {
        message += block.text.text + '\n\n';
      }
    }

    const slackMessage: SlackMessage = {
      channel: config.slack.channel,
      text: message,
      blocks
    };

    await slack.chat.postMessage(slackMessage);
    consoleOutput.log('TV show notifications sent successfully.');
  } catch (error) {
    consoleOutput.error(
      'Failed to send TV show notifications:', 
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Start the TV show notification service
 */
export function startTvShowNotifier(): void {
  const consoleOutput = container.resolve<ConsoleOutput>('ConsoleOutput');
  
  if (config.slack.enabled !== true) {
    consoleOutput.log(
      'Slack notifications are disabled. Set slack.enabled to true in config to enable.'
    );
    return;
  }

  // Create a cron schedule from the notification time in the config
  const hour = config.notificationTime.split(':')[0];
  const minute = config.notificationTime.split(':')[1];
  const cronSchedule = `0 ${minute} ${hour} * * *`;

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
  const groups: Record<string, Show[]> = {};
  
  for (const show of shows) {
    // Get network name (or web channel name if no network)
    let networkName = 'Unknown Network';
    
    if (
      show.show.network?.name !== undefined && 
      show.show.network.name !== null && 
      show.show.network.name !== ''
    ) {
      networkName = show.show.network.name;
    } else if (
      show.show.webChannel?.name !== undefined && 
      show.show.webChannel.name !== null && 
      show.show.webChannel.name !== ''
    ) {
      networkName = show.show.webChannel.name;
    }
    
    // Initialize group if it doesn't exist
    if (groups[networkName] === undefined) {
      groups[networkName] = [];
    }
    
    // Add show to its network group
    groups[networkName].push(show);
  }
  
  return groups;
}

/**
 * Format show details for display
 * @param show Show to format
 * @returns Formatted show details
 */
function formatShowDetails(show: Show): string {
  const time: string = show.airtime || 'TBA';
  const episodeInfo: string = `S${show.season}E${show.number}`;
  return `• \`${time}\` *${show.show.name}* (${show.show.type || 'Unknown'}) - ` +
    `${episodeInfo}\n${show.name ? `  "${show.name}"\n` : ''}`;
}

// Check if running in test mode
if (process.argv.includes('--test')) {
  // Just run once and exit
  void sendTvShowNotifications().then(() => process.exit(0));
} else {
  startTvShowNotifier();
}
