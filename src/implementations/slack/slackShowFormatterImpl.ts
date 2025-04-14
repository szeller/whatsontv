import { injectable } from 'tsyringe';

import type { Show } from '../../schemas/domain.js';
import type { 
  SlackBlock, 
  SlackSectionBlock,
  SlackHeaderBlock,
  SlackDividerBlock
} from '../../interfaces/slackClient.js';
import { formatTimeWithPeriod } from '../../utils/dateUtils.js';
import { BaseShowFormatterImpl } from '../baseShowFormatterImpl.js';

/**
 * Formats TV show data into Slack message blocks
 */
@injectable()
export class SlackShowFormatterImpl extends BaseShowFormatterImpl<SlackBlock> {
  constructor() {
    super();
  }

  /**
   * Format a show with a specific airtime
   * @param show Show with a specific airtime
   * @returns Formatted show representation as a Slack block
   */
  public formatTimedShow(show: Show): SlackBlock {
    return this.formatShow(show, true);
  }

  /**
   * Format a show with no specific airtime (TBA)
   * @param show Show with no specific airtime
   * @returns Formatted show representation as a Slack block
   */
  public formatUntimedShow(show: Show): SlackBlock {
    return this.formatShow(show, false);
  }

  /**
   * Format a show with consistent styling
   * @param show Show to format
   * @param useShowAirtime Whether to use the show's airtime or a placeholder
   * @param customEpisodeInfo Optional custom episode info to override the default
   * @returns Formatted show representation as a Slack block
   */
  private formatShow(
    show: Show,
    useShowAirtime: boolean,
    customEpisodeInfo?: string
  ): SlackSectionBlock {
    // Get type emoji
    const typeEmoji = this.getTypeEmoji(show.type);
    
    // Handle time
    const time = useShowAirtime && show.airtime !== null && show.airtime !== undefined 
      ? formatTimeWithPeriod(show.airtime)
      : 'TBA';
    
    // Handle name
    const showName = show.name !== null && show.name !== undefined 
      ? show.name : this.UNKNOWN_SHOW;
    
    // Handle episode info
    const hasCustomEpisodeInfo = customEpisodeInfo !== undefined && 
      customEpisodeInfo !== null && 
      customEpisodeInfo !== '';
    const episodeInfo = hasCustomEpisodeInfo
      ? customEpisodeInfo 
      : this.formatEpisodeInfo(show);

    // Create Slack block
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${typeEmoji} *${showName}* ${episodeInfo} (${time})`
      }
    };
  }

  /**
   * Format multiple episodes of the same show
   * @param shows Multiple episodes of the same show
   * @returns Formatted output for multiple episodes
   */
  public formatMultipleEpisodes(shows: Show[]): SlackBlock[] {
    if (!Array.isArray(shows) || shows.length === 0) {
      return [];
    }
    
    // Sort episodes by season and episode number
    const sortedEpisodes = [...shows].sort((a, b) => {
      // First sort by season
      if (a.season !== b.season) {
        return (a.season || 0) - (b.season || 0);
      }
      // Then by episode number
      return (a.number || 0) - (b.number || 0);
    });
    
    // Get the first show for basic information
    const firstShow = sortedEpisodes[0];
    
    // Format episode ranges
    const episodeRange = this.formatEpisodeRange(sortedEpisodes);
    
    // Use the formatShow method with custom episode range
    const formattedBlock = this.formatShow(firstShow, false, episodeRange);
    
    // Return as array with a single block
    return [formattedBlock];
  }

  /**
   * Format episode range for multiple episodes
   * @param shows Multiple episodes of the same show
   * @returns Formatted episode range
   */
  private formatEpisodeRange(shows: Show[]): string {
    if (!Array.isArray(shows)) {
      return '';
    }
    
    if (shows.length === 0) {
      return '';
    }
    
    if (shows.length === 1) {
      return this.formatEpisodeInfo(shows[0]);
    }
    
    const firstEpisode = shows[0];
    const lastEpisode = shows[shows.length - 1];
    
    const firstInfo = this.formatEpisodeInfo(firstEpisode);
    const lastInfo = this.formatEpisodeInfo(lastEpisode);
    
    // If same season, just show a range of episode numbers
    if (firstEpisode.season === lastEpisode.season) {
      if (!firstEpisode.number || !lastEpisode.number) {
        return firstInfo;
      }
      
      const season = `S${String(firstEpisode.season).padStart(2, '0')}`;
      const firstEp = String(firstEpisode.number).padStart(2, '0');
      const lastEp = String(lastEpisode.number).padStart(2, '0');
      
      return `${season}E${firstEp}-${lastEp}`;
    }
    
    // Different seasons, show full range
    return `${firstInfo}-${lastInfo}`;
  }

  /**
   * Get emoji based on show type
   * @param type Show type
   * @returns Emoji string
   */
  private getTypeEmoji(type?: string): string {
    if (type === null || type === undefined || type === '') {
      return '📺';
    }
    
    const normalizedType = type.toLowerCase();
    
    switch (normalizedType) {
    case 'animation':
      return '🎬';
    case 'documentary':
      return '🎥';
    case 'reality':
      return '👨‍👩‍👧‍👦';
    case 'sports':
      return '⚽';
    case 'talk show':
      return '🎤';
    case 'news':
      return '📰';
    case 'scripted':
      return '📝';
    case 'variety':
      return '🎭';
    default:
      return '📺';
    }
  }

  /**
   * Format the header for network display
   * @param network The network name
   * @returns Formatted header items
   */
  protected formatNetworkHeader(network: string): SlackBlock[] {
    const safeNetwork = network !== null && network !== undefined 
      ? network : this.NO_NETWORK;
    
    const headerBlock: SlackHeaderBlock = {
      type: 'header',
      text: {
        type: 'plain_text',
        text: safeNetwork,
        emoji: true
      }
    };
    
    const dividerBlock: SlackDividerBlock = {
      type: 'divider'
    };
    
    return [headerBlock, dividerBlock];
  }

  /**
   * Format content for an empty network
   * @param network The network name
   * @returns Formatted empty network content
   */
  protected formatEmptyNetwork(network: string): SlackBlock[] {
    return this.formatNetworkHeader(network);
  }

  /**
   * Format the header content for the network groups
   * @returns Formatted header content
   */
  protected formatHeader(): SlackBlock[] {
    const headerBlock: SlackHeaderBlock = {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'Shows by Network',
        emoji: true
      }
    };
    
    return [headerBlock];
  }

  /**
   * Format the footer content for the network groups
   * @returns Formatted footer content
   */
  protected formatFooter(): SlackBlock[] {
    return [];
  }

  /**
   * Format separator between networks
   * @returns Formatted network separator
   */
  protected formatNetworkSeparator(): SlackBlock[] {
    const dividerBlock: SlackDividerBlock = {
      type: 'divider'
    };
    
    return [dividerBlock];
  }
}
