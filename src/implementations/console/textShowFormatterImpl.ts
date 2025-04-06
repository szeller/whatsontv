/**
 * Implementation of the text formatter for console output
 */
import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';

import type { TextShowFormatter } from '../../interfaces/showFormatter.js';
import type { StyleService } from '../../interfaces/styleService.js';
import type { TvShowService } from '../../interfaces/tvShowService.js';
import type { ConfigService } from '../../interfaces/configService.js';
import type { NetworkGroups, Show } from '../../schemas/domain.js';
import { compareEpisodes, sortShowsByTime, formatEpisodeRanges } from '../../utils/showUtils.js';
import { getStringValue, padString } from '../../utils/stringUtils.js';
import { 
  formatNetworkName, 
  formatShowType, 
  formatEpisodeInfo
} from '../../utils/consoleFormatUtils.js';

/**
 * Implementation of the TextShowFormatter interface for console output
 */
@injectable()
export class TextShowFormatterImpl implements TextShowFormatter {
  // Constants for formatting
  private readonly NO_AIRTIME = 'N/A';
  private readonly NO_EPISODE = 'TBA';
  private readonly NO_SEASON = 'TBA';
  private readonly NO_NETWORK = 'Unknown Network';
  private readonly UNKNOWN_SHOW = 'Unknown Show';
  private readonly UNKNOWN_TYPE = 'Unknown';
  
  // Padding lengths for consistent column widths
  private readonly PAD_LENGTHS = {
    time: 8,
    network: 15,
    type: 10,
    showName: 25,
    episodeInfo: 20
  };
  
  /**
   * Constructor
   * @param styleService Service for styling text
   * @param tvShowService Service for TV show operations
   * @param configService Service for configuration options
   */
  constructor(
    @inject('StyleService') private readonly styleService: StyleService,
    @inject('TvShowService') private readonly tvShowService: TvShowService,
    @inject('ConfigService') private readonly configService: ConfigService
  ) {}

  /**
   * Format a show with a specific airtime
   * @param show Show with a specific airtime
   * @returns Formatted show string
   */
  public formatTimedShow(show: Show): string {
    // Use utility functions to format individual components
    const time = getStringValue(show.airtime, this.NO_AIRTIME);
    
    // Special case for network - use 'N/A' for empty networks in formatTimedShow
    const network = show.network ? formatNetworkName(show.network) : 'N/A';
    
    const type = formatShowType(show.type);
    const showName = getStringValue(show.name, this.UNKNOWN_SHOW);
    const episodeInfo = formatEpisodeInfo(show);
    
    // Format each component with consistent padding
    const timeStr = padString(time, this.PAD_LENGTHS.time);
    const networkStr = this.styleService.boldCyan(
      padString(network, this.PAD_LENGTHS.network)
    );
    const typeStr = this.styleService.magenta(padString(type, this.PAD_LENGTHS.type));
    const showNameStr = this.styleService.green(
      padString(showName, this.PAD_LENGTHS.showName)
    );
    const episodeInfoStr = this.styleService.yellow(
      padString(episodeInfo, this.PAD_LENGTHS.episodeInfo)
    );
    
    // Combine all components with consistent spacing
    return `${timeStr} ${networkStr} ${typeStr} ${showNameStr} ${episodeInfoStr}`;
  }
  
  /**
   * Format a show with no specific airtime (TBA)
   * @param show Show with no specific airtime
   * @returns Formatted show string
   */
  public formatUntimedShow(show: Show): string {
    // Use utility functions to format individual components
    const network = formatNetworkName(show.network || this.NO_NETWORK);
    const type = formatShowType(show.type);
    const showName = getStringValue(show.name, this.UNKNOWN_SHOW);
    const episodeInfo = formatEpisodeInfo(show);
    
    // Format each component with consistent padding
    const timeStr = padString(this.NO_AIRTIME, this.PAD_LENGTHS.time);
    const networkStr = this.styleService.boldCyan(
      padString(network, this.PAD_LENGTHS.network)
    );
    const typeStr = this.styleService.magenta(padString(type, this.PAD_LENGTHS.type));
    const showNameStr = this.styleService.green(
      padString(showName, this.PAD_LENGTHS.showName)
    );
    const episodeInfoStr = this.styleService.yellow(
      padString(episodeInfo, this.PAD_LENGTHS.episodeInfo)
    );
    
    // Combine all components with consistent spacing
    return `${timeStr} ${networkStr} ${typeStr} ${showNameStr} ${episodeInfoStr}`;
  }

  /**
   * Format multiple episodes of the same show
   * @param shows Multiple episodes of the same show
   * @returns Array of formatted show strings
   */
  public formatMultipleEpisodes(shows: Show[]): string[] {
    if (!Array.isArray(shows) || shows.length === 0) {
      return [];
    }
    
    // Sort episodes by season and episode number
    const sortedShows = [...shows].sort(compareEpisodes);
    
    // Get the base show information from the first show
    const baseShow = sortedShows[0];
    const network = formatNetworkName(baseShow.network || this.NO_NETWORK);
    const type = formatShowType(baseShow.type);
    const showName = getStringValue(baseShow.name, this.UNKNOWN_SHOW);
    
    // Format the episode ranges
    const episodeList = formatEpisodeRanges(sortedShows);
    
    // Format each component with consistent padding
    const timeStr = padString(this.NO_AIRTIME, this.PAD_LENGTHS.time);
    const networkStr = this.styleService.boldCyan(
      padString(network, this.PAD_LENGTHS.network)
    );
    const typeStr = this.styleService.magenta(padString(type, this.PAD_LENGTHS.type));
    const showNameStr = this.styleService.green(
      padString(showName, this.PAD_LENGTHS.showName)
    );
    const episodeInfoStr = this.styleService.yellow(
      padString(episodeList, this.PAD_LENGTHS.episodeInfo)
    );
    
    // Create a single line with all episodes
    const formattedLine = `${timeStr} ${networkStr} ${typeStr} ${showNameStr} ${episodeInfoStr}`;
    
    // Return as array with a single string
    return [formattedLine];
  }
  
  /**
   * Format a single network and its shows
   * @param network Network name
   * @param shows Shows in the network
   * @returns Array of formatted strings for the network and its shows
   */
  public formatNetwork(network: string, shows: Show[]): string[] {
    if (!Array.isArray(shows) || shows.length === 0) {
      return [];
    }

    const output: string[] = [];
    
    // Add the network header with colon
    const networkHeader = `${network || this.NO_NETWORK}:`;
    output.push(this.styleService.boldCyan(networkHeader));
    
    // Add a separator line
    const separatorLine = '-'.repeat(networkHeader.length);
    output.push(this.styleService.dim(separatorLine));
    
    // Sort shows by time
    const sortedShows = sortShowsByTime(shows);
    
    // Group shows by show ID to handle multiple episodes
    const showGroups: Record<string, Show[]> = {};
    for (const show of sortedShows) {
      const showId = show.id.toString();
      if (!Object.prototype.hasOwnProperty.call(showGroups, showId)) {
        showGroups[showId] = [];
      }
      showGroups[showId].push(show);
    }
    
    // Process each show group in the order of the sorted shows
    const processedShowIds = new Set<string>();
    
    // Process shows in the sorted order
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
          show.airtime !== null && show.airtime !== undefined && show.airtime !== '' 
            ? this.formatTimedShow(show) 
            : this.formatUntimedShow(show)
        );
      } else if (showGroup.every(show => {
        return show.airtime === undefined || show.airtime === null || show.airtime === '';
      })) {
        // Multiple episodes without airtime
        output.push(...this.formatMultipleEpisodes(showGroup));
      } else {
        // Multiple episodes with different airtimes
        // Sort by airtime, then by episode number
        const sortedEpisodes = sortShowsByTime(showGroup);
        for (const episode of sortedEpisodes) {
          output.push(
            episode.airtime !== null && episode.airtime !== undefined && episode.airtime !== '' 
              ? this.formatTimedShow(episode) 
              : this.formatUntimedShow(episode)
          );
        }
      }
    }
    
    return output;
  }

  /**
   * Format shows grouped by network
   * @param networkGroups Shows grouped by network
   * @returns Formatted shows string array
   */
  public formatNetworkGroups(networkGroups: NetworkGroups): string[] {
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
}
