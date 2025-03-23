import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';

import type { ShowFormatter } from '../../interfaces/showFormatter.js';
import type { StyleService } from '../../interfaces/styleService.js';
import type { TvShowService } from '../../interfaces/tvShowService.js';
import type { Show } from '../../types/tvmaze.js';

/**
 * Slack implementation of the ShowFormatter interface
 * Formats TV show information for display in Slack
 */
@injectable()
export class SlackFormatterImpl implements ShowFormatter {
  // Constants for formatting
  private readonly UNKNOWN_SHOW = 'Unknown Show';
  private readonly UNKNOWN_TYPE = 'Unknown';
  private readonly NO_AIRTIME = 'TBA';
  private readonly MULTIPLE_EPISODES = 'Multiple Episodes';

  /**
   * Constructor
   * @param styleService Service for styling text
   * @param tvShowService Service for TV show operations
   */
  constructor(
    @inject('StyleService') private readonly styleService: StyleService,
    @inject('TvShowService') private readonly tvShowService: TvShowService
  ) {}

  /**
   * Format a single show for display in Slack
   * @param show Show to format
   * @returns Formatted string for Slack
   */
  public formatShow(show: Show): string {
    return show.airtime ? this.formatTimedShow(show) : this.formatUntimedShow(show);
  }

  /**
   * Format a show with a specific airtime for Slack
   * @param show Show with a specific airtime
   * @returns Formatted show string for Slack
   */
  public formatTimedShow(show: Show): string {
    // Extract show information
    const time = show.airtime || this.NO_AIRTIME;
    const network = 
      show.show.network?.name !== undefined && show.show.network?.name !== null 
        ? show.show.network.name 
        : 'N/A';
    const type = 
      show.show.type !== undefined && show.show.type !== null && show.show.type !== '' 
        ? show.show.type 
        : 'N/A';
    const showName = 
      show.show.name !== undefined && show.show.name !== null && show.show.name !== '' 
        ? show.show.name 
        : 'Unknown';
    const episodeInfo = `S${show.season}E${show.number}`;
    
    // Format for Slack - using bold and emoji for better visibility
    const timeStr = `*${time}*`;
    const networkStr = `*${network}*`;
    const typeStr = `_${type}_`;
    const showNameStr = `*${showName}*`;
    const episodeInfoStr = episodeInfo;
    const episodeName = show.name || '';
    
    // Combine all components with emoji for better visibility in Slack
    return [
      `:tv: ${showNameStr} (${episodeInfoStr})`,
      `:clock3: ${timeStr} | :satellite: ${networkStr} | :film_frames: ${typeStr}`,
      episodeName ? `:memo: ${episodeName}` : ''
    ].filter(Boolean).join('\n');
  }

  /**
   * Format a show with no specific airtime for Slack
   * @param show Show with no specific airtime
   * @returns Formatted show string for Slack
   */
  public formatUntimedShow(show: Show): string {
    // Extract show information
    const network = 
      show.show.network?.name !== undefined && show.show.network?.name !== null 
        ? show.show.network.name 
        : 'Unknown';
    const type = 
      show.show.type !== undefined && show.show.type !== null 
        ? show.show.type 
        : 'Unknown';
    const showName = 
      show.show.name !== undefined && show.show.name !== null 
        ? show.show.name 
        : 'Unknown';
    const episodeInfo = `S${show.season}E${show.number}`;
    
    // Format for Slack - using bold and emoji for better visibility
    const timeStr = `*${this.NO_AIRTIME}*`;
    const networkStr = `*${network}*`;
    const typeStr = `_${type}_`;
    const showNameStr = `*${showName}*`;
    const episodeInfoStr = episodeInfo;
    const episodeName = show.name || '';
    
    // Combine all components with emoji for better visibility in Slack
    return [
      `:tv: ${showNameStr} (${episodeInfoStr})`,
      `:clock3: ${timeStr} | :satellite: ${networkStr} | :film_frames: ${typeStr}`,
      episodeName ? `:memo: ${episodeName}` : ''
    ].filter(Boolean).join('\n');
  }

  /**
   * Format multiple episodes of the same show with no specific airtime for Slack
   * @param episodes Episodes to format
   * @returns Formatted episodes string for Slack
   */
  public formatMultipleEpisodes(episodes: Show[]): string {
    if (episodes.length === 0) {
      return '';
    }
    
    // Get the first episode to extract show information
    const firstEpisode = episodes[0];
    
    // Extract show information
    const network = 
      firstEpisode.show.network?.name !== undefined && 
      firstEpisode.show.network?.name !== null 
        ? firstEpisode.show.network.name 
        : 'Unknown';
    const type = 
      firstEpisode.show.type !== undefined && firstEpisode.show.type !== null 
        ? firstEpisode.show.type 
        : 'Unknown';
    const showName = 
      firstEpisode.show.name !== undefined && firstEpisode.show.name !== null 
        ? firstEpisode.show.name 
        : 'Unknown';
    
    // Format for Slack
    const timeStr = `*${this.NO_AIRTIME}*`;
    const networkStr = `*${network}*`;
    const typeStr = `_${type}_`;
    const showNameStr = `*${showName}*`;
    const multipleStr = `*${this.MULTIPLE_EPISODES}*`;
    
    // Format header
    const header = [
      `:tv: ${showNameStr} (${multipleStr})`,
      `:clock3: ${timeStr} | :satellite: ${networkStr} | :film_frames: ${typeStr}`
    ].join('\n');
    
    // Format individual episodes
    const episodeLines = episodes.map(episode => {
      const episodeInfo = `S${episode.season}E${episode.number}`;
      const episodeName = episode.name || '';
      return `• *${episodeInfo}*: ${episodeName}`;
    });
    
    // Combine header and episode lines
    return [header, ...episodeLines].join('\n');
  }

  /**
   * Format shows grouped by network for Slack
   * @param networkGroups Shows grouped by network
   * @param timeSort Whether to sort shows by time
   * @returns Formatted shows string array for Slack
   */
  public formatNetworkGroups(networkGroups: Record<string, Show[]>, timeSort = false): string[] {
    const output: string[] = [];
    
    // Get network names and sort them alphabetically
    const networks = Object.keys(networkGroups).sort();
    
    for (const network of networks) {
      // Add network header
      output.push(`\n*${network}*`);
      output.push('------------------------');
      
      // Get shows for this network
      let shows = networkGroups[network];
      
      // Sort shows by time if requested
      if (timeSort && shows.length > 0) {
        shows = [...shows].sort((a, b) => {
          // Handle shows without airtime
          if (!a.airtime) return 1;
          if (!b.airtime) return -1;
          
          // Compare airtime strings
          return a.airtime.localeCompare(b.airtime);
        });
      }
      
      // Group shows by show ID to handle multiple episodes
      const showGroups: Record<string, Show[]> = {};
      for (const show of shows) {
        const showId = show.show.id;
        if (showId !== undefined) {
          const showIdKey = showId.toString();
          if (showGroups[showIdKey] === undefined) {
            showGroups[showIdKey] = [];
          }
          showGroups[showIdKey].push(show);
        }
      }
      
      // Format each show or show group
      for (const showIdKey of Object.keys(showGroups)) {
        const showGroup = showGroups[showIdKey];
        
        // Format based on number of episodes
        if (showGroup.length === 1) {
          // Single episode
          output.push(this.formatShow(showGroup[0]));
        } else if (showGroup.every(show => !show.airtime)) {
          // Multiple episodes without airtime
          output.push(this.formatMultipleEpisodes(showGroup));
        } else {
          // Multiple episodes with different airtimes
          for (const show of showGroup) {
            output.push(this.formatShow(show));
          }
        }
      }
    }
    
    return output;
  }
}
