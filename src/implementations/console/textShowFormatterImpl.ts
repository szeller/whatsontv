import { injectable, inject } from 'tsyringe';
import type { StyleService } from '../../interfaces/styleService.js';
import type { TextShowFormatter } from '../../interfaces/showFormatter.js';
import type { Show, NetworkGroups } from '../../schemas/domain.js';
import {
  formatNetworkHeader,
  groupShowsByShowId,
  prepareShowRowComponents,
  hasAirtime,
  allShowsHaveNoAirtime
} from '../../utils/consoleFormatUtils.js';
import { compareEpisodes, sortShowsByTime, formatEpisodeRanges } from '../../utils/showUtils.js';

/**
 * Implementation of TextShowFormatter that uses console styling
 */
@injectable()
export class TextShowFormatterImpl implements TextShowFormatter {
  // Constants for formatting
  private readonly NO_AIRTIME = 'N/A';
  private readonly NO_NETWORK = 'N/A';
  private readonly UNKNOWN_SHOW = 'Unknown Show';
  private readonly UNKNOWN_TYPE = 'Unknown';
    
  constructor(
    @inject('StyleService') private readonly styleService: StyleService
  ) {}

  /**
   * Format a show with a specific airtime
   * @param show Show with a specific airtime
   * @returns Formatted show representation
   */
  formatTimedShow(show: Show): string {
    return this.formatShow(show, true);
  }

  /**
   * Format a show with no specific airtime (TBA)
   * @param show Show with no specific airtime
   * @returns Formatted show representation
   */
  formatUntimedShow(show: Show): string {
    return this.formatShow(show, false);
  }

  /**
   * Private helper method to format a show with consistent styling
   * @param show Show to format
   * @param useShowAirtime Whether to use the show's airtime or a placeholder
   * @returns Formatted show representation
   */
  private formatShow(
    show: Show, 
    useShowAirtime: boolean
  ): string {
    const components = prepareShowRowComponents(show, {
      noAirtime: this.NO_AIRTIME,
      noNetwork: this.NO_NETWORK,
      unknownShow: this.UNKNOWN_SHOW,
      unknownType: this.UNKNOWN_TYPE
    });
    
    // Apply padding before styling
    const timeValue = useShowAirtime ? components.time : this.NO_AIRTIME;
    const paddedTime = timeValue.padEnd(8);
    const paddedShowName = components.showName.padEnd(20);
    const paddedEpisodeInfo = components.episodeInfo.padEnd(10);
    
    // Apply styling to padded components
    const styledTime = this.styleService.bold(paddedTime);
    const styledNetwork = this.styleService.boldCyan(components.network);
    const styledType = this.styleService.magenta(components.type);
    const styledShowName = this.styleService.green(paddedShowName);
    const styledEpisodeInfo = this.styleService.yellow(paddedEpisodeInfo);
    
    // Create formatted string
    return `${styledTime} ${styledShowName} ${styledEpisodeInfo} (${styledNetwork}, ${styledType})`;
  }
  
  /**
   * Format multiple episodes of the same show with no specific airtime
   * @param shows Multiple episodes of the same show
   * @returns Formatted show representations
   */
  formatMultipleEpisodes(shows: Show[]): string[] {
    if (!Array.isArray(shows) || shows.length === 0) {
      return [];
    }
    
    // Sort episodes by season and episode number
    const sortedEpisodes = [...shows].sort(compareEpisodes);
    
    // Get the first show for basic information
    const firstShow = sortedEpisodes[0];
    
    // Format episode ranges
    const episodeList = formatEpisodeRanges(sortedEpisodes);
    
    // Get formatted components
    const components = prepareShowRowComponents(firstShow);
    
    // Apply styling to each component
    const styledNetwork = this.styleService.boldCyan(components.network);
    const styledType = this.styleService.magenta(components.type);
    const styledShowName = this.styleService.green(components.showName);
    const styledEpisodeInfo = this.styleService.yellow(episodeList);
    
    // Create formatted string
    let result = `• ${styledShowName}`;
    
    if (episodeList) {
      result += ` ${styledEpisodeInfo}`;
    }
    
    result += ` (${styledNetwork}, ${styledType})`;
    
    // Return as array with a single string
    return [result];
  }
  
  /**
   * Format a single network and its shows
   * @param network Network name
   * @param shows Shows in the network
   * @returns Formatted output for the network and its shows
   */
  formatNetwork(network: string, shows: Show[]): string[] {
    if (!Array.isArray(shows) || shows.length === 0) {
      return [];
    }
    
    const output: string[] = [];
    
    // Add the network header
    const [networkHeader, separatorLine] = formatNetworkHeader(network, this.NO_NETWORK);
    output.push(this.styleService.boldCyan(networkHeader));
    output.push(this.styleService.dim(separatorLine));
    
    // Sort shows by time
    const sortedShows = sortShowsByTime(shows);
    
    // Group shows by show ID
    const showGroups = groupShowsByShowId(sortedShows);
    
    // Process each show in the sorted order
    const processedShowIds = new Set<string>();
    
    for (const show of sortedShows) {
      const showId = show.id.toString();
      if (processedShowIds.has(showId)) {
        continue;
      }
      
      const showGroup = showGroups[showId];
      processedShowIds.add(showId);
      
      // Format based on number of episodes
      if (showGroup.length === 1) {
        // Single episode
        output.push(
          hasAirtime(show)
            ? this.formatTimedShow(show) 
            : this.formatUntimedShow(show)
        );
      } else if (allShowsHaveNoAirtime(showGroup)) {
        // Multiple episodes without airtime
        output.push(...this.formatMultipleEpisodes(showGroup));
      } else {
        // Multiple episodes with different airtimes
        // Sort by airtime, then by episode number
        const sortedEpisodes = sortShowsByTime(showGroup);
        for (const episode of sortedEpisodes) {
          output.push(
            hasAirtime(episode)
              ? this.formatTimedShow(episode) 
              : this.formatUntimedShow(episode)
          );
        }
      }
    }
    
    return output;
  }
  
  /**
   * Format a group of shows by network
   * @param networkGroups Shows grouped by network
   * @returns Formatted output for the network groups
   */
  formatNetworkGroups(networkGroups: NetworkGroups): string[] {
    if (networkGroups === null || networkGroups === undefined) {
      return [];
    }
    
    const output: string[] = [];
    
    // Get network names and sort them alphabetically
    const networks = Object.keys(networkGroups).sort();
    
    // Process each network
    for (const network of networks) {
      // Get shows for this network
      const shows = networkGroups[network];
      
      // Skip empty networks
      if (!Array.isArray(shows) || shows.length === 0) {
        continue;
      }
      
      // Add extra line before each network (except the first one)
      if (output.length > 0) {
        output.push('');
      }
      
      // Add the formatted network and its shows
      output.push(...this.formatNetwork(network, shows));
    }
    
    return output;
  }

  /**
   * Format a list of shows
   * @param shows Shows to format
   * @returns Formatted text output
   */
  formatShows(shows: Show[]): string[] {
    if (shows === null || shows === undefined || shows.length === 0) {
      return ['No shows found'];
    }

    // Group shows by network
    const networkGroups: Record<string, Show[]> = this.groupShowsByNetwork(shows);
    
    // Format the network groups
    return this.formatNetworkGroups(networkGroups);
  }

  /**
   * Group shows by network
   * @param shows - Shows to group
   * @returns Record with network names as keys and arrays of shows as values
   */
  private groupShowsByNetwork(shows: Show[]): NetworkGroups {
    const networkGroups: NetworkGroups = {};
    
    shows.forEach(show => {
      const networkName = show.network || 'Unknown Network';
      
      if (!Object.prototype.hasOwnProperty.call(networkGroups, networkName)) {
        networkGroups[networkName] = [];
      }
      
      networkGroups[networkName].push(show);
    });
    
    return networkGroups;
  }
}
