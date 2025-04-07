import { inject, injectable } from 'tsyringe';
import type { SlackShowFormatter } from '../../interfaces/showFormatter.js';
import type { Show, NetworkGroups } from '../../schemas/domain.js';
import type { ConfigService } from '../../interfaces/configService.js';
import type { SlackBlock } from '../../interfaces/slackClient.js';

/**
 * Slack implementation of the SlackShowFormatter interface
 * Formats TV show information for display in Slack using Block Kit format
 */
@injectable()
export class SlackFormatterImpl implements SlackShowFormatter {
  // Constants for formatting
  private readonly UNKNOWN_SHOW = 'Unknown Show';
  private readonly UNKNOWN_TYPE = 'Unknown';
  private readonly NO_AIRTIME = 'N/A';
  
  constructor(
    @inject('ConfigService') private readonly configService: ConfigService
  ) {}

  /**
   * Format a show with a specific airtime
   * @param show Show with a specific airtime
   * @returns Formatted show as a Slack block
   */
  formatTimedShow(show: Show): SlackBlock {
    const showName = show.name || this.UNKNOWN_SHOW;
    const airtime = show.airtime !== null && show.airtime !== undefined && show.airtime !== '' 
      ? show.airtime 
      : this.NO_AIRTIME;
    
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${showName}* (${airtime})`
      }
    };
  }
  
  /**
   * Format a show with no specific airtime
   * @param show Show with no specific airtime
   * @returns Formatted show as a Slack block
   */
  formatUntimedShow(show: Show): SlackBlock {
    const showName = show.name || this.UNKNOWN_SHOW;
    
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${showName}* (${this.NO_AIRTIME})`
      }
    };
  }

  /**
   * Format multiple episodes of the same show
   * @param shows Multiple episodes of the same show
   * @returns Formatted show as Slack blocks
   */
  formatMultipleEpisodes(shows: Show[]): SlackBlock[] {
    if (!shows.length) return [];
    
    const firstShow = shows[0];
    const showName = firstShow.name || this.UNKNOWN_SHOW;
    
    return [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${showName}* (${shows.length} episodes)`
      }
    }];
  }
  
  /**
   * Format a network's shows for display
   * @param network Network name
   * @param shows Shows on this network
   * @returns Formatted network as Slack blocks
   */
  formatNetwork(network: string, shows: Show[]): SlackBlock[] {
    if (!shows.length) return [];
    
    const blocks: SlackBlock[] = [];
    
    // Add network header
    blocks.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: network,
        emoji: true
      }
    });
    
    // Add shows as a list
    const showTexts = shows.map(show => {
      const showName = show.name || this.UNKNOWN_SHOW;
      const airtime = show.airtime !== null && show.airtime !== undefined && show.airtime !== '' 
        ? show.airtime 
        : this.NO_AIRTIME;
      return `• *${showName}* (${airtime})`;
    }).join('\n');
    
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: showTexts
      }
    });
    
    return blocks;
  }

  /**
   * Format network groups for display
   * @param networkGroups Shows grouped by network
   * @returns Formatted network groups as Slack blocks
   */
  formatNetworkGroups(networkGroups: NetworkGroups): SlackBlock[] {
    const blocks: SlackBlock[] = [];
    
    // Add header
    blocks.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📺 TV Shows',
        emoji: true
      }
    });
    
    // Add show count
    const totalShows = Object.values(networkGroups).flat().length;
    blocks.push({
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: `Found *${totalShows}* shows`
      }]
    });
    
    // Add divider
    blocks.push({ type: 'divider' });
    
    // Add each network
    for (const network of Object.keys(networkGroups).sort()) {
      const shows = networkGroups[network];
      if (shows.length === 0) continue;
      
      // Add network blocks
      blocks.push(...this.formatNetwork(network, shows));
      
      // Add divider between networks
      blocks.push({ type: 'divider' });
    }
    
    // Add footer
    blocks.push({
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: '_Data provided by TVMaze API_'
      }]
    });
    
    return blocks;
  }
}
