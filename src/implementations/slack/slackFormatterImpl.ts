import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';

import type { ShowFormatter } from '../../interfaces/showFormatter.js';
import type { StyleService } from '../../interfaces/styleService.js';
import type { TvShowService } from '../../interfaces/tvShowService.js';
import type { Show } from '../../types/tvmaze.js';

/**
 * Slack implementation of the ShowFormatter interface
 * Formats TV show information for display in Slack
 * 
 * TODO: This is a stub implementation that will be properly implemented in the future
 */
@injectable()
export class SlackFormatterImpl implements ShowFormatter {
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
   * TODO: Implement actual Slack formatting
   */
  public formatShow(show: Show): string {
    return show.airtime ? this.formatTimedShow(show) : this.formatUntimedShow(show);
  }

  /**
   * Format a show with a specific airtime for Slack
   * @param show Show with a specific airtime
   * @returns Formatted show string for Slack
   * TODO: Implement actual Slack formatting
   */
  public formatTimedShow(show: Show): string {
    return `*${show.show.name}* (${show.airtime})`;
  }

  /**
   * Format a show with no specific airtime for Slack
   * @param show Show with no specific airtime
   * @returns Formatted show string for Slack
   * TODO: Implement actual Slack formatting
   */
  public formatUntimedShow(show: Show): string {
    return `*${show.show.name}* (TBA)`;
  }

  /**
   * Format multiple episodes of the same show with no specific airtime for Slack
   * @param shows Multiple episodes of the same show
   * @returns Formatted show string for Slack
   * TODO: Implement actual Slack formatting
   */
  public formatMultipleEpisodes(shows: Show[]): string {
    if (shows.length === 0) {
      return 'No episodes found';
    }
    
    const showName = shows[0].show.name || 'Unknown Show';
    return `*${showName}* (Multiple Episodes)`;
  }

  /**
   * Format a list of shows for display in Slack
   * @param shows Shows to format
   * @returns Formatted string for Slack
   * TODO: Implement actual Slack formatting
   */
  public formatShows(shows: Show[]): string {
    if (shows.length === 0) {
      return 'No shows found';
    }
    
    return shows.map(show => this.formatShow(show)).join('\n');
  }

  /**
   * Format a list of shows with airtime for display in Slack
   * @param shows Shows to format
   * @returns Formatted string for Slack
   * TODO: Implement actual Slack formatting
   */
  public formatShowsWithAirtime(shows: Show[]): string {
    return this.formatShows(shows);
  }

  /**
   * Format network groups for display in Slack
   * @param networkGroups Shows grouped by network
   * @param _timeSort Whether to sort shows by time (unused in stub)
   * @returns Array of formatted strings for Slack
   * TODO: Implement actual Slack formatting
   */
  public formatNetworkGroups(networkGroups: Record<string, Show[]>, _timeSort = false): string[] {
    const result: string[] = [];
    
    for (const [network, shows] of Object.entries(networkGroups)) {
      result.push(`*${network}*`);
      result.push(this.formatShows(shows));
      result.push(''); // Empty line between networks
    }
    
    return result;
  }
}
