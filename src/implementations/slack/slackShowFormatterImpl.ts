import 'reflect-metadata';
import { injectable } from 'tsyringe';

import type { SlackShowFormatter } from '../../interfaces/showFormatter.js';
import type { Show } from '../../schemas/domain.js';
import type { 
  SlackBlock, 
  SlackSectionBlock, 
  SlackHeaderBlock,
  SlackDividerBlock,
  SlackContextBlock
} from '../../interfaces/slackClient.js';
import { formatTimeWithPeriod } from '../../utils/dateUtils.js';
import { BaseShowFormatterImpl } from '../baseShowFormatterImpl.js';
import { hasAirtime } from '../../utils/formatUtils.js';

/**
 * Formats TV show data into Slack message blocks using the compact format
 */
@injectable()
export class SlackShowFormatterImpl extends BaseShowFormatterImpl<SlackBlock> 
  implements SlackShowFormatter {

  /**
   * Format a show with a specific airtime
   * @param show Show with a specific airtime
   * @returns Formatted show representation as a Slack block
   */
  public formatTimedShow(show: Show): SlackSectionBlock {
    const components = this.prepareShowComponents(show);
    const airtime = formatTimeWithPeriod(show.airtime);
    const typeEmoji = this.getTypeEmoji(components.type);
    
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${typeEmoji} *${components.showName}* ${components.episodeInfo} (${airtime})`
      }
    };
  }
  
  /**
   * Format a show with no specific airtime (TBA)
   * @param show Show with no specific airtime
   * @returns Formatted show representation as a Slack block
   */
  public formatUntimedShow(show: Show): SlackSectionBlock {
    const components = this.prepareShowComponents(show);
    const typeEmoji = this.getTypeEmoji(components.type);
    
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${typeEmoji} *${components.showName}* ${components.episodeInfo} (${this.NO_AIRTIME})`
      }
    };
  }
  
  /**
   * Format multiple episodes of the same show with no specific airtime
   * @param shows Multiple episodes of the same show
   * @returns Formatted show representations as Slack blocks
   */
  public formatMultipleEpisodes(shows: Show[]): SlackBlock[] {
    if (!shows?.length) {
      const emptyBlock: SlackSectionBlock = {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'No episodes found'
        }
      };
      return [emptyBlock];
    }
    
    // Sort episodes by season and episode number
    const sortedEpisodes = this.sortEpisodesByNumber(shows);
    
    const firstShow = sortedEpisodes[0];
    const components = this.prepareShowComponents(firstShow);
    const typeEmoji = this.getTypeEmoji(components.type);
    
    // If all episodes are from the same season, consolidate them
    const allSameSeason = sortedEpisodes.every(
      (show) => show.season === sortedEpisodes[0].season
    );
    
    if (allSameSeason && sortedEpisodes.length > 1) {
      const firstEp = sortedEpisodes[0];
      const lastEp = sortedEpisodes[sortedEpisodes.length - 1];
      
      // Format as range if sequential
      if (lastEp.number && firstEp.number && 
          lastEp.number - firstEp.number === sortedEpisodes.length - 1) {
        const season = `S${String(firstEp.season).padStart(2, '0')}`;
        const firstEpNum = String(firstEp.number).padStart(2, '0');
        const lastEpNum = String(lastEp.number).padStart(2, '0');
        
        // Determine if any episode has an airtime
        const hasAirtimeValue = shows.some(show => hasAirtime(show));
        
        const airtime = hasAirtimeValue ? 
          ` (${formatTimeWithPeriod(firstEp.airtime)})` : 
          ` (${this.NO_AIRTIME})`;
        
        const consolidatedBlock: SlackSectionBlock = {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: (
              `${typeEmoji} *${components.showName}* ` +
              `${season}E${firstEpNum}-${lastEpNum}${airtime}`
            )
          }
        };
        
        return [consolidatedBlock];
      }
    }
    
    // If not consolidated, show each episode on its own line
    const episodeTexts = sortedEpisodes.map(show => {
      const episodeInfo = this.formatEpisodeInfo(show);
      const hasAirtimeValue = hasAirtime(show);
      const airtime = hasAirtimeValue ? 
        formatTimeWithPeriod(show.airtime) : 
        this.NO_AIRTIME;
      
      return (
        `${typeEmoji} *${components.showName}* ` +
        `${episodeInfo} (${airtime})`
      );
    });
    
    const multiEpisodeBlock: SlackSectionBlock = {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: episodeTexts.join('\n')
      }
    };
    
    return [multiEpisodeBlock];
  }
  
  /**
   * Format the header for network display
   * @param network The network name
   * @returns Formatted header items
   */
  protected formatNetworkHeader(network: string): SlackBlock[] {
    const formattedNetwork = this.formatNetworkName(network);
    
    const headerBlock: SlackHeaderBlock = {
      type: 'header',
      text: {
        type: 'plain_text',
        text: formattedNetwork,
        emoji: true
      }
    };
    
    return [headerBlock];
  }
  
  /**
   * Format content for an empty network
   * @param network The network name
   * @returns Formatted empty network content
   */
  protected formatEmptyNetwork(network: string): SlackBlock[] {
    const headerBlocks = this.formatNetworkHeader(network);
    
    const emptyBlock: SlackSectionBlock = {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'No shows found for this network'
      }
    };
    
    return [...headerBlocks, emptyBlock];
  }
  
  /**
   * Format the header content for the network groups
   * @returns Formatted header content
   */
  protected formatHeader(): SlackBlock[] {
    const blocks: SlackBlock[] = [];
    
    // Add header block
    const headerBlock: SlackHeaderBlock = {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'Shows by Network',
        emoji: true
      }
    };
    blocks.push(headerBlock);
    
    // Add divider after header
    const dividerBlock: SlackDividerBlock = { type: 'divider' };
    blocks.push(dividerBlock);
    
    return blocks;
  }
  
  /**
   * Format the footer content for the network groups
   * @returns Formatted footer content
   */
  protected formatFooter(): SlackBlock[] {
    // Add footer
    const footerBlock: SlackContextBlock = {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '_Data provided by TVMaze API_'
        }
      ]
    };
    
    return [footerBlock];
  }
  
  /**
   * Format separator between networks
   * @returns Formatted network separator
   */
  protected formatNetworkSeparator(): SlackBlock[] {
    return [{ type: 'divider' }];
  }

  /**
   * Get an emoji representing the show type
   * @param type The show type
   * @returns An emoji representing the show type
   */
  private getTypeEmoji(type: string): string {
    if (!type || type === this.UNKNOWN_TYPE) {
      return '📺';
    }
    
    switch (type.toLowerCase()) {
    case 'scripted':  return '📝';
    case 'reality':   return '👁';
    case 'talk':      return '🎙';
    case 'documentary': return '🎬';
    case 'variety':   return '🎭';
    case 'game':      return '🎮';
    case 'news':      return '📰';
    case 'sports':    return '⚽';
    default:          return '📺';
    }
  }
}
