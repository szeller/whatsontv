import { injectable, inject } from 'tsyringe';
import type { StyleService } from '../../interfaces/styleService.js';
import type { Show } from '../../schemas/domain.js';
import { formatNetworkHeader } from '../../utils/formatUtils.js';
import { BaseShowFormatterImpl } from '../baseShowFormatterImpl.js';

/**
 * Implementation of TextShowFormatter that uses console styling
 */
@injectable()
export class TextShowFormatterImpl extends BaseShowFormatterImpl<string> {
  readonly NO_AIRTIME = 'N/A';
  readonly NO_NETWORK = 'Unknown Network';
  readonly UNKNOWN_SHOW = 'Unknown Show';
  readonly UNKNOWN_TYPE = 'Unknown';

  constructor(
    @inject('StyleService') private readonly styleService: StyleService
  ) {
    super();
  }

  /**
   * Format a show with a specific airtime
   * @param show Show with a specific airtime
   * @returns Formatted show representation
   */
  public formatTimedShow(show: Show): string {
    return this.formatShow(show, true);
  }

  /**
   * Format a show with no specific airtime (TBA)
   * @param show Show with no specific airtime
   * @returns Formatted show representation
   */
  public formatUntimedShow(show: Show): string {
    return this.formatShow(show, false);
  }

  /**
   * Private helper method to format a show with consistent styling
   * @param show Show to format
   * @param useShowAirtime Whether to use the show's airtime or a placeholder
   * @param customEpisodeInfo Optional custom episode info to override the default
   * @returns Formatted show representation
   */
  private formatShow(
    show: Show, 
    useShowAirtime: boolean,
    customEpisodeInfo?: string
  ): string {
    const components = this.prepareShowComponents(show);
    
    // Apply padding before styling
    const timeValue = useShowAirtime ? components.time : this.NO_AIRTIME;
    const paddedTime = timeValue.padEnd(8);
    const paddedShowName = components.showName.padEnd(20);
    
    // Handle custom episode info with explicit null/empty checks
    const hasCustomEpisodeInfo = customEpisodeInfo !== undefined && 
      customEpisodeInfo !== null && 
      customEpisodeInfo !== '';
    const episodeInfo = hasCustomEpisodeInfo ? customEpisodeInfo : components.episodeInfo;
    const paddedEpisodeInfo = episodeInfo.padEnd(10);
    
    // Apply styling to padded components
    const styledTime = this.styleService.bold(paddedTime);
    const styledNetwork = this.styleService.boldCyan(components.network);
    const styledType = this.styleService.magenta(components.type);
    const styledShowName = this.styleService.green(paddedShowName);
    const styledEpisodeInfo = this.styleService.yellow(paddedEpisodeInfo);
    
    // Create formatted string
    return `${styledTime} ${styledShowName} ${styledEpisodeInfo} ` +
      `(${styledNetwork}, ${styledType})`;
  }
  
  /**
   * Format multiple episodes of the same show
   * @param shows Multiple episodes of the same show
   * @returns Formatted output for multiple episodes
   */
  public formatMultipleEpisodes(shows: Show[]): string[] {
    if (!Array.isArray(shows) || shows.length === 0) {
      return [];
    }
    
    // Sort episodes by season and episode number
    const sortedEpisodes = this.sortEpisodesByNumber(shows);
    
    // Get the first show for basic information
    const firstShow = sortedEpisodes[0];
    
    // Format episode ranges
    const episodeRange = this.formatEpisodeRange(sortedEpisodes);
    
    // Use the existing formatShow method with custom episode range
    const formattedShow = this.formatShow(firstShow, true, episodeRange);
    
    // Return as array with a single string
    return [formattedShow];
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
   * Format the header for network display
   * @param network The network name
   * @returns Formatted header items
   */
  protected formatNetworkHeader(network: string): string[] {
    const [networkHeader, separatorLine] = formatNetworkHeader(network, this.NO_NETWORK);
    return [
      this.styleService.boldCyan(networkHeader),
      this.styleService.dim(separatorLine)
    ];
  }

  /**
   * Format content for an empty network
   * @param network The network name
   * @returns Formatted empty network content
   */
  protected formatEmptyNetwork(network: string): string[] {
    return this.formatNetworkHeader(network);
  }

  /**
   * Format the header content for the network groups
   * @returns Formatted header content
   */
  protected formatHeader(): string[] {
    return []; // No header content for text formatter
  }

  /**
   * Format the footer content for the network groups
   * @returns Formatted footer content
   */
  protected formatFooter(): string[] {
    return []; // No footer content for text formatter
  }

  /**
   * Format separator between networks
   * @returns Formatted network separator
   */
  protected formatNetworkSeparator(): string[] {
    return [''];
  }
}
