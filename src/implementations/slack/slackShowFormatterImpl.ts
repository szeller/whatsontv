import 'reflect-metadata';
import { injectable } from 'tsyringe';

import type { SlackShowFormatter } from '../../interfaces/showFormatter.js';
import type { NetworkGroups, Show } from '../../schemas/domain.js';
import type { 
  SlackBlock, 
  SlackSectionBlock, 
  SlackHeaderBlock,
  SlackDividerBlock,
  SlackContextBlock
} from '../../interfaces/slackClient.js';
import { formatTimeWithPeriod } from '../../utils/dateUtils.js';

/**
 * Formats TV show data into Slack message blocks using the compact format
 */
@injectable()
export class SlackShowFormatterImpl implements SlackShowFormatter {
  /**
   * Format a show with a specific airtime
   * @param show Show with a specific airtime
   * @returns Formatted show representation as a Slack block
   */
  public formatTimedShow(show: Show): SlackSectionBlock {
    const airtime = formatTimeWithPeriod(show.airtime);
    const episodeInfo = this.formatEpisodeInfo(show);
    const typeEmoji = this.getTypeEmoji(show.type);
    
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${typeEmoji} *${show.name}* ${episodeInfo} (${airtime})`
      }
    };
  }
  
  /**
   * Format a show with no specific airtime (TBA)
   * @param show Show with no specific airtime
   * @returns Formatted show representation as a Slack block
   */
  public formatUntimedShow(show: Show): SlackSectionBlock {
    const episodeInfo = this.formatEpisodeInfo(show);
    const typeEmoji = this.getTypeEmoji(show.type);
    
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${typeEmoji} *${show.name}* ${episodeInfo} (TBA)`
      }
    };
  }
  
  /**
   * Format multiple episodes of the same show with no specific airtime
   * @param shows Multiple episodes of the same show
   * @returns Formatted show representations as Slack blocks
   */
  public formatMultipleEpisodes(shows: Show[]): SlackBlock[] {
    if (!shows.length) {
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
    const sortedEpisodes = [...shows].sort((a, b) => {
      // First sort by season
      if (a.season !== b.season) {
        return (a.season || 0) - (b.season || 0);
      }
      // Then by episode number
      return (a.number || 0) - (b.number || 0);
    });
    
    const typeEmoji = this.getTypeEmoji(shows[0].type);
    const showName = shows[0].name;
    
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
        const hasAirtime = sortedEpisodes.some(
          (show) => show.airtime !== null && show.airtime !== undefined && show.airtime !== ''
        );
        
        const airtime = hasAirtime ? 
          ` (${formatTimeWithPeriod(firstEp.airtime)})` : 
          ' (TBA)';
        
        const consolidatedBlock: SlackSectionBlock = {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${typeEmoji} *${showName}* ${season}E${firstEpNum}-${lastEpNum}${airtime}`
          }
        };
        
        return [consolidatedBlock];
      }
    }
    
    // If not consolidated, show each episode on its own line
    const episodeTexts = sortedEpisodes.map(show => {
      const episodeInfo = this.formatEpisodeInfo(show);
      const hasAirtime = show.airtime !== null && 
                         show.airtime !== undefined && 
                         show.airtime !== '';
      const airtimeText = hasAirtime ? 
        ` (${formatTimeWithPeriod(show.airtime)})` : 
        ' (TBA)';
      return `  • ${episodeInfo}${airtimeText}`;
    });
    
    const episodesBlock: SlackSectionBlock = {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${typeEmoji} *${showName}*\n${episodeTexts.join('\n')}`
      }
    };
    
    return [episodesBlock];
  }
  
  /**
   * Format a single network and its shows
   * @param network Network name
   * @param shows Shows in the network
   * @returns Formatted output for the network and its shows as Slack blocks
   */
  public formatNetwork(network: string, shows?: Show[]): SlackBlock[] {
    if (!shows || shows.length === 0) {
      const headerBlock: SlackSectionBlock = {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${network}*`
        }
      };
      return [headerBlock];
    }
    
    const blocks: SlackBlock[] = [];
    
    // Add network header
    const headerBlock: SlackSectionBlock = {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${network}*`
      }
    };
    blocks.push(headerBlock);
    
    // Group shows by name to consolidate multiple episodes of the same show
    const showsByName: Record<string, Show[]> = {};
    for (const show of shows) {
      const name = show.name || 'Unknown Show';
      if (showsByName[name] === undefined) {
        showsByName[name] = [];
      }
      showsByName[name].push(show);
    }
    
    // Format all shows for this network into a single block
    const showLines: string[] = [];
    
    for (const [showName, showGroup] of Object.entries(showsByName)) {
      if (showGroup.length > 1 && showGroup.every(s => s.season === showGroup[0].season)) {
        // Check if episodes are sequential
        const sortedEpisodes = [...showGroup].sort((a, b) => {
          return (a.number || 0) - (b.number || 0);
        });
        
        const isSequential = sortedEpisodes.every((show, index, arr) => {
          if (index === 0) return true;
          return (show.number || 0) === (arr[index - 1].number || 0) + 1;
        });
        
        if (isSequential && sortedEpisodes.length > 1) {
          // Consolidate sequential episodes
          const firstEp = sortedEpisodes[0];
          const lastEp = sortedEpisodes[sortedEpisodes.length - 1];
          
          if (firstEp.number && lastEp.number) {
            const typeEmoji = this.getTypeEmoji(firstEp.type);
            const season = `S${String(firstEp.season).padStart(2, '0')}`;
            const firstEpNum = String(firstEp.number).padStart(2, '0');
            const lastEpNum = String(lastEp.number).padStart(2, '0');
            
            // Use the airtime of the first episode if available
            const hasAirtime = firstEp.airtime !== null && 
                              firstEp.airtime !== undefined && 
                              firstEp.airtime !== '';
            const airtime = hasAirtime ? 
              ` (${formatTimeWithPeriod(firstEp.airtime)})` : 
              ' (N/A)';
            
            showLines.push(
              `${typeEmoji} *${showName}* ${season}E${firstEpNum}-${lastEpNum}${airtime}`
            );
            continue;
          }
        }
      }
      
      // If not consolidated, format each show individually
      for (const show of showGroup) {
        const airtime = show.airtime !== null && 
                        show.airtime !== undefined && 
                        show.airtime !== '' ? 
          formatTimeWithPeriod(show.airtime) : 'N/A';
        const episodeInfo = this.formatEpisodeInfo(show);
        const typeEmoji = this.getTypeEmoji(show.type);
        
        showLines.push(`${typeEmoji} *${showName}* ${episodeInfo} (${airtime})`);
      }
    }
    
    const showsBlock: SlackSectionBlock = {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: showLines.join('\n')
      }
    };
    blocks.push(showsBlock);
    
    return blocks;
  }
  
  /**
   * Format a list of network groups into Slack blocks
   * @param networkGroups The network groups to format
   * @returns Slack blocks representing the network groups
   */
  public formatNetworkGroups(networkGroups: NetworkGroups): SlackBlock[] {
    const blocks: SlackBlock[] = [];
    const totalShows = Object.values(networkGroups).reduce(
      (count, shows) => count + shows.length, 
      0
    );

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

    // Add context with show count
    const contextBlock: SlackContextBlock = {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Found *${totalShows}* shows airing today`
        }
      ]
    };
    blocks.push(contextBlock);

    // Add divider after header
    const dividerBlock: SlackDividerBlock = { type: 'divider' };
    blocks.push(dividerBlock);

    // Process each network group
    Object.entries(networkGroups).forEach(([network, shows]) => {
      // Add network blocks
      blocks.push(...this.formatNetwork(network, shows));
      
      // Add divider between networks
      blocks.push({ type: 'divider' });
    });

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
    blocks.push(footerBlock);

    return blocks;
  }

  /**
   * Format episode info in the format S01E01
   * @param show The show to format episode info for
   * @returns Formatted episode info string
   */
  private formatEpisodeInfo(show: Show): string {
    if (!show.season && !show.number) {
      return '';
    }
    
    const season = show.season 
      ? `S${String(show.season).padStart(2, '0')}` 
      : '';
      
    const episode = show.number 
      ? `E${String(show.number).padStart(2, '0')}` 
      : '';
    
    return season + episode;
  }

  /**
   * Get an emoji representing the show type
   * @param type The show type
   * @returns An emoji representing the show type
   */
  private getTypeEmoji(type: string | null | undefined): string {
    if (type === null || type === undefined || type === '') {
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
