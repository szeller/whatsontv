import 'reflect-metadata';

import type { ShowFormatter } from '../interfaces/showFormatter.js';
import type { Show, NetworkGroups } from '../schemas/domain.js';
import { 
  groupShowsByShowId, 
  hasAirtime, 
  allShowsHaveNoAirtime 
} from '../utils/consoleFormatUtils.js';
import { sortShowsByTime } from '../utils/showUtils.js';

/**
 * Base abstract implementation of ShowFormatter with common functionality
 * for different output formats
 * @template TOutput The type of output format (string, SlackBlock, etc.)
 */
export abstract class BaseShowFormatterImpl<TOutput> implements ShowFormatter<TOutput> {
  // Constants for formatting that can be overridden by subclasses
  protected readonly NO_AIRTIME = 'N/A';
  protected readonly NO_NETWORK = 'N/A';
  protected readonly UNKNOWN_SHOW = 'Unknown Show';
  protected readonly UNKNOWN_TYPE = 'Unknown';

  /**
   * Format a show with a specific airtime
   * @param show Show with a specific airtime
   * @returns Formatted show representation
   */
  public abstract formatTimedShow(show: Show): TOutput;

  /**
   * Format a show with no specific airtime (TBA)
   * @param show Show with no specific airtime
   * @returns Formatted show representation
   */
  public abstract formatUntimedShow(show: Show): TOutput;

  /**
   * Format multiple episodes of the same show
   * @param shows Multiple episodes of the same show
   * @returns Formatted output for multiple episodes
   */
  public abstract formatMultipleEpisodes(shows: Show[]): TOutput[];

  /**
   * Format a single network and its shows
   * @param network Network name
   * @param shows Shows in the network
   * @returns Formatted output for the network and its shows
   */
  public formatNetwork(network: string, shows: Show[]): TOutput[] {
    if (!Array.isArray(shows) || shows.length === 0) {
      return this.formatEmptyNetwork(network);
    }
    
    const output: TOutput[] = [];
    
    // Add the network header
    const networkHeader = this.formatNetworkHeader(network);
    for (const headerItem of networkHeader) {
      output.push(headerItem);
    }
    
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
        const formattedShow = hasAirtime(show)
          ? this.formatTimedShow(show)
          : this.formatUntimedShow(show);
        output.push(formattedShow);
      } else if (allShowsHaveNoAirtime(showGroup)) {
        // Multiple episodes without airtime
        const multipleEpisodes = this.formatMultipleEpisodes(showGroup);
        for (const episode of multipleEpisodes) {
          output.push(episode);
        }
      } else {
        // Multiple episodes with different airtimes
        // Sort by airtime, then by episode number
        const sortedEpisodes = sortShowsByTime(showGroup);
        for (const episode of sortedEpisodes) {
          const formattedEpisode = hasAirtime(episode)
            ? this.formatTimedShow(episode)
            : this.formatUntimedShow(episode);
          output.push(formattedEpisode);
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
  public formatNetworkGroups(networkGroups: NetworkGroups): TOutput[] {
    if (networkGroups === null || networkGroups === undefined) {
      return [];
    }
    
    const output: TOutput[] = [];
    
    // Add header content
    const headerContent = this.formatHeader();
    for (const item of headerContent) {
      output.push(item);
    }
    
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
      
      // Add separator between networks if needed
      if (output.length > 0 && !this.isFirstNetwork(network, networks)) {
        const separator = this.formatNetworkSeparator();
        for (const item of separator) {
          output.push(item);
        }
      }
      
      // Add the formatted network and its shows
      const formattedNetwork = this.formatNetwork(network, shows);
      for (const item of formattedNetwork) {
        output.push(item);
      }
    }
    
    // Add footer content
    const footerContent = this.formatFooter();
    for (const item of footerContent) {
      output.push(item);
    }
    
    return output;
  }

  /**
   * Format episode information in the format S01E01
   * @param show The show to format episode info for
   * @returns Formatted episode info string
   */
  protected formatEpisodeInfo(show: Show): string {
    if (show === null || show === undefined || (!show.season && !show.number)) {
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
   * Format the header for network display
   * @param network The network name
   * @returns Formatted header items
   */
  protected abstract formatNetworkHeader(network: string): TOutput[];

  /**
   * Format content for an empty network
   * @param network The network name
   * @returns Formatted empty network content
   */
  protected abstract formatEmptyNetwork(network: string): TOutput[];

  /**
   * Format the header content for the network groups
   * @returns Formatted header content
   */
  protected abstract formatHeader(): TOutput[];

  /**
   * Format the footer content for the network groups
   * @returns Formatted footer content
   */
  protected abstract formatFooter(): TOutput[];

  /**
   * Format separator between networks
   * @returns Formatted network separator
   */
  protected abstract formatNetworkSeparator(): TOutput[];

  /**
   * Check if this is the first network in the list
   * @param network Current network
   * @param allNetworks All networks
   * @returns True if this is the first network
   */
  protected isFirstNetwork(network: string, allNetworks: string[]): boolean {
    return allNetworks.indexOf(network) === 0;
  }
}
