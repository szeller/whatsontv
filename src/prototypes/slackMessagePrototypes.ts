/**
 * Slack Message Format Prototypes
 * 
 * This file contains prototype functions for generating different Slack message formats
 * to visualize how TV show data would appear in Slack.
 */
import type { Show } from '../schemas/domain.js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Local types for Slack message components
// Note: These are intentionally separate from src/interfaces/slackClient.ts types.
// Prototypes need flexible generic types for experimentation (e.g., 'actions' blocks),
// while production code uses strictly typed unions for type safety.
interface SlackBlock {
  type: string;
  [key: string]: unknown;
}

interface SlackMessagePayload {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
  username?: string;
  icon_emoji?: string;
}

// Load sample show data from fixtures
function loadSampleShows(): Show[] {
  try {
    // Load and combine shows from different fixture files
    const fixturesPath = resolve(__dirname, '../../src/tests/fixtures');
    
    const networkShowsPath = resolve(fixturesPath, 'domain/network-shows.json');
    const cableShowsPath = resolve(fixturesPath, 'domain/cable-shows.json');
    const streamingShowsPath = resolve(fixturesPath, 'domain/streaming-shows.json');
    
    const networkShows = JSON.parse(readFileSync(networkShowsPath, 'utf8')) as Show[];
    const cableShows = JSON.parse(readFileSync(cableShowsPath, 'utf8')) as Show[];
    const streamingShows = JSON.parse(readFileSync(streamingShowsPath, 'utf8')) as Show[];
    
    // Combine all shows
    return [...networkShows, ...cableShows, ...streamingShows];
  } catch (error) {
    console.error('Error loading sample shows:', error);
    return [];
  }
}

// Group shows by network
function groupShowsByNetwork(shows: Show[]): Record<string, Show[]> {
  const groups: Record<string, Show[]> = {};
  
  shows.forEach(show => {
    const networkName = show.network;
    
    groups[networkName] ??= [];
    groups[networkName].push(show);
  });
  
  return groups;
}

// Format episode info
function formatEpisodeInfo(show: Show): string {
  if (!show.season && !show.number) {
    return '';
  }
  
  const season = show.season ? `S${String(show.season).padStart(2, '0')}` : '';
  const episode = show.number ? `E${String(show.number).padStart(2, '0')}` : '';
  
  return season + episode;
}

/**
 * PROTOTYPE 1: Basic Text Format
 * 
 * A simple text-based format with minimal formatting
 */
export function generateBasicTextFormat(): SlackMessagePayload {
  const shows = loadSampleShows();
  const networkGroups = groupShowsByNetwork(shows);
  
  let messageText = '*📺 TV Shows for Today*\n\n';
  
  Object.entries(networkGroups).forEach(([network, shows]) => {
    messageText += `*${network}*:\n`;
    
    shows.forEach(show => {
      const airtime = show.airtime ?? 'N/A';
      const episodeInfo = formatEpisodeInfo(show);
      messageText += `• ${show.name} ${episodeInfo} (${airtime} | ${show.type})\n`;
    });
    
    messageText += '\n';
  });
  
  messageText += '_Data provided by TVMaze API_';
  
  return {
    channel: 'tv-shows',
    text: messageText
  };
}

/**
 * PROTOTYPE 2: Rich Block Format
 * 
 * Uses Slack's Block Kit for more structured and visually appealing messages
 */
export function generateRichBlockFormat(): SlackMessagePayload {
  const shows = loadSampleShows();
  const networkGroups = groupShowsByNetwork(shows);
  
  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📺 TV Shows for Today',
        emoji: true
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Found *${shows.length}* shows airing today`
        }
      ]
    },
    {
      type: 'divider'
    }
  ];
  
  Object.entries(networkGroups).forEach(([network, shows]) => {
    // Add network header
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${network}*`
      }
    });
    
    // Add shows for this network
    shows.forEach(show => {
      const airtime = show.airtime ?? 'N/A';
      const episodeInfo = formatEpisodeInfo(show);
      
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${show.name}* ${episodeInfo}\n${airtime} | ${show.type}`
        }
      });
    });
    
    // Add a divider between networks
    blocks.push({
      type: 'divider'
    });
  });
  
  // Add footer
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: '_Data provided by TVMaze API_'
      }
    ]
  });
  
  return {
    channel: 'tv-shows',
    text: 'TV Shows for Today',
    blocks
  };
}

/**
 * PROTOTYPE 3: Compact Format with Emoji Indicators
 * 
 * A more compact format that uses emojis to indicate show types
 */
export function generateCompactFormat(): SlackMessagePayload {
  const shows = loadSampleShows();
  const networkGroups = groupShowsByNetwork(shows);
  
  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📺 TV Shows for Today',
        emoji: true
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Found *${shows.length}* shows airing today`
        }
      ]
    },
    {
      type: 'divider'
    }
  ];
  
  Object.entries(networkGroups).forEach(([network, shows]) => {
    // Add network header
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${network}*`
      }
    });
    
    // Format all shows for this network into a single block
    const showLines = shows.map(show => {
      const airtime = show.airtime ?? 'N/A';
      const episodeInfo = formatEpisodeInfo(show);
      const typeEmoji = getTypeEmoji(show.type);
      
      return `${typeEmoji} *${show.name}* ${episodeInfo} (${airtime})`;
    });
    
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: showLines.join('\n')
      }
    });
    
    // Add a divider between networks
    blocks.push({
      type: 'divider'
    });
  });
  
  // Add footer
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: '_Data provided by TVMaze API_'
      }
    ]
  });
  
  return {
    channel: 'tv-shows',
    text: 'TV Shows for Today',
    blocks
  };
}

/**
 * PROTOTYPE 4: Interactive Format
 * 
 * Includes interactive elements like buttons for filtering
 */
export function generateInteractiveFormat(): SlackMessagePayload {
  const shows = loadSampleShows();
  const networkGroups = groupShowsByNetwork(shows);
  
  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📺 TV Shows for Today',
        emoji: true
      }
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'All Shows',
            emoji: true
          },
          value: 'all',
          action_id: 'filter_all'
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Scripted',
            emoji: true
          },
          value: 'scripted',
          action_id: 'filter_scripted'
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Reality',
            emoji: true
          },
          value: 'reality',
          action_id: 'filter_reality'
        }
      ]
    },
    {
      type: 'divider'
    }
  ];
  
  Object.entries(networkGroups).forEach(([network, shows]) => {
    // Add network header with accessory
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${network}*`
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Expand/Collapse',
          emoji: true
        },
        value: `toggle_${network.toLowerCase().replaceAll(/\s+/g, '_')}`,
        action_id: 'toggle_network'
      }
    });
    
    // Add shows for this network
    shows.forEach(show => {
      const airtime = show.airtime ?? 'N/A';
      const episodeInfo = formatEpisodeInfo(show);
      const typeEmoji = getTypeEmoji(show.type);
      
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 
            `${typeEmoji} *${show.name}* ${episodeInfo}\n` +
            `  ${airtime} | ${show.type}`
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Details',
            emoji: true
          },
          value: `details_${show.id}`,
          action_id: 'show_details'
        }
      });
    });
    
    // Add a divider between networks
    blocks.push({
      type: 'divider'
    });
  });
  
  // Add footer
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: '_Data provided by TVMaze API (https://api.tvmaze.com)_'
      }
    ]
  });
  
  return {
    channel: 'tv-shows',
    text: 'TV Shows for Today',
    blocks
  };
}

// Helper function to get emoji for show type
function getTypeEmoji(type: string): string {
  if (type === '') {
    return '📺';
  }
  
  switch (type.toLowerCase()) {
  case 'scripted':
    return '📝';
  case 'reality':
    return '👁';
  case 'talk':
    return '🎙';
  case 'documentary':
    return '🎬';
  case 'variety':
    return '🎭';
  case 'game':
    return '🎮';
  case 'news':
    return '📰';
  case 'sports':
    return '⚽';
  default:
    return '📺';
  }
}

// Log all prototypes to the error console for debugging only
// This function is intentionally unused in production but kept for development
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function logPrototypes(): void {
  console.error('\n=== BASIC TEXT FORMAT ===\n');
  console.error(JSON.stringify(generateBasicTextFormat(), null, 2));
  
  console.error('\n=== RICH BLOCK FORMAT ===\n');
  console.error(JSON.stringify(generateRichBlockFormat(), null, 2));
  
  console.error('\n=== COMPACT FORMAT ===\n');
  console.error(JSON.stringify(generateCompactFormat(), null, 2));
  
  console.error('\n=== INTERACTIVE FORMAT ===\n');
  console.error(JSON.stringify(generateInteractiveFormat(), null, 2));
}

// Main function for ES modules
const main = (): void => {
  // Uncomment to log prototypes during development
  // logPrototypes();
};

// Run the main function
main();
