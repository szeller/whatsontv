import 'dotenv/config';
import schedule from 'node-schedule';
import { WebClient } from '@slack/web-api';
import { fetchTvShows } from './services/tvShowService.js';
import config from './config.js';
import type { Show } from './types/tvmaze.js';

interface ShowSummary {
  show_name: string;
  episode_name: string;
  season: string | number;
  episode_number: string | number;
  network: string;
  time: string;
  type: string;
}

// Initialize Slack client if enabled
let slack: WebClient | undefined;
if (config.slack.enabled && config.slack.botToken) {
  slack = new WebClient(config.slack.botToken);
}

async function getTvShows(
  options: { types?: string[]; networks?: string[] } = {}
): Promise<ShowSummary[]> {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Fetch TV shows using the improved service with config defaults
    const shows = await fetchTvShows({
      date: today,
      country: config.country,
      types: options.types || config.types,
      networks: options.networks || config.networks
    });

    return shows.map((show: Show) => ({
      show_name: show.show.name,
      episode_name: show.name,
      season: show.season,
      episode_number: show.number,
      network: show.show.network?.name || show.show.webChannel?.name || 'N/A',
      time: show.airtime,
      type: show.show.type || 'Unknown'
    }));
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching TV shows:', error.message);
    } else {
      console.error('Unknown error fetching TV shows');
    }
    return [];
  }
}

async function sendSlackNotification(shows: ShowSummary[]): Promise<void> {
  if (!config.slack.enabled || !slack) {
    console.log('Slack notifications are disabled');
    return;
  }

  try {
    let message: string;

    if (shows.length === 0) {
      message = 'No new TV shows today!';
    } else {
      message = '📺 *TV Shows Today:*\n\n';

      // Group shows by network
      const showsByNetwork = shows.reduce<Record<string, ShowSummary[]>>((acc, show) => {
        const network = show.network;
        if (!acc[network]) {
          acc[network] = [];
        }
        acc[network].push(show);
        return acc;
      }, {});

      // Format shows by network
      Object.entries(showsByNetwork).forEach(([network, networkShows]) => {
        message += `*${network}*\n`;
        networkShows.forEach(show => {
          const time = show.time || 'TBA';
          const episodeInfo = `S${show.season}E${show.episode_number}`;
          message += `• \`${time}\` *${show.show_name}* (${show.type}) - ${episodeInfo}\n`;
          if (show.episode_name) {
            message += `  "${show.episode_name}"\n`;
          }
        });
        message += '\n';
      });
    }

    await slack.chat.postMessage({
      channel: config.slack.channel || '',
      text: message,
      mrkdwn: true
    });

    console.log('Slack notification sent successfully!');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error sending Slack message:', error.message);
    } else {
      console.error('Unknown error sending Slack message');
    }
  }
}

async function dailyTvShowCheck(): Promise<void> {
  console.log('Fetching today\'s TV shows...');
  const shows = await getTvShows();
  await sendSlackNotification(shows);
}

// Check if running in test mode
if (process.argv.includes('--test')) {
  // Just run once and exit
  dailyTvShowCheck().then(() => process.exit(0));
} else {
  // Schedule the job to run daily at the configured time
  const [hour, minute] = config.notificationTime.split(':');
  const cronSchedule = `${minute} ${hour} * * *`;
  schedule.scheduleJob(cronSchedule, dailyTvShowCheck);
  console.log(`TV Show Notifier is running. Scheduled for ${config.notificationTime} daily.`);
}
