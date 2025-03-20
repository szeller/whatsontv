import chalk from 'chalk';

import type { ShowFormatter } from '../interfaces/showFormatter.js';
import { sortShowsByTime } from '../services/tvShowService.js';
import type { Show } from '../types/tvmaze.js';

/**
 * Formatter for console output of TV show information
 * Implements the ShowFormatter interface
 */
export class ConsoleFormatter implements ShowFormatter {
  // Constants for formatting
  private readonly NO_AIRTIME = 'TBA';
  private readonly MULTIPLE_EPISODES = 'Multiple';
  private readonly INDENT_SPACES = 3;
  private readonly PAD_LENGTHS = {
    network: 19,
    type: 11,
    showName: 34,
    episodeInfo: 9,
    time: 7
  };
  private readonly UNKNOWN_SHOW = 'Unknown Show';
  private readonly UNKNOWN_TYPE = 'Unknown';
  private readonly UNKNOWN_NETWORK = 'Unknown Network';

  /**
   * Format a single show for display
   * Delegates to the appropriate formatter based on airtime
   * @param show Show to format
   * @returns Formatted show string with ANSI colors
   */
  public formatShow(show: Show): string {
    return show.airtime ? this.formatTimedShow(show) : this.formatUntimedShow(show);
  }

  /**
   * Format a show with a specific airtime
   * @param show Show with a specific airtime
   * @returns Formatted show string with ANSI colors
   */
  public formatTimedShow(show: Show): string {
    const time = this.formatTime(show.airtime);
    const network: string = this.getNetworkName(show);
    const episodeInfo: string = `S${show.season}E${show.number}`;
    const showName: string = show.show.name || this.UNKNOWN_SHOW;
    const type: string = show.show.type || this.UNKNOWN_TYPE;
    
    // Format each component with consistent padding
    const timeStr: string = chalk.dim(time.padEnd(this.PAD_LENGTHS.time));
    const networkStr: string = chalk.bold.cyan(network.padEnd(this.PAD_LENGTHS.network));
    const typeStr: string = chalk.magenta(type.padEnd(this.PAD_LENGTHS.type));
    const showNameStr: string = chalk.green(showName.padEnd(this.PAD_LENGTHS.showName));
    const episodeInfoStr: string = chalk.yellow(episodeInfo.padEnd(this.PAD_LENGTHS.episodeInfo));
    const episodeName: string = show.name || '';
    const episodeNameStr: string = chalk.dim(episodeName);

    // Combine all components with consistent spacing
    const headerLine = `${timeStr} ${networkStr} ${typeStr} ${showNameStr} ${episodeInfoStr}`;
    
    return episodeName ? `${headerLine} ${episodeNameStr}` : headerLine;
  }

  /**
   * Format a show with no specific airtime (TBA)
   * @param show Show with no specific airtime
   * @returns Formatted show string with ANSI colors
   */
  public formatUntimedShow(show: Show): string {
    const displayTime: string = this.NO_AIRTIME;
    const network: string = this.getNetworkName(show);
    const episodeInfo: string = `S${show.season}E${show.number}`;
    const showName: string = show.show.name || this.UNKNOWN_SHOW;
    const type: string = show.show.type || this.UNKNOWN_TYPE;
    
    // Format each component with consistent padding
    const timeStr: string = chalk.dim(displayTime.padEnd(this.PAD_LENGTHS.time));
    const networkStr: string = chalk.bold.cyan(network.padEnd(this.PAD_LENGTHS.network));
    const typeStr: string = chalk.magenta(type.padEnd(this.PAD_LENGTHS.type));
    const showNameStr: string = chalk.green(showName.padEnd(this.PAD_LENGTHS.showName));
    const episodeInfoStr: string = chalk.yellow(episodeInfo.padEnd(this.PAD_LENGTHS.episodeInfo));
    const episodeName: string = show.name || '';
    const episodeNameStr: string = chalk.dim(episodeName);

    // Combine all components with consistent spacing
    const headerLine = `${timeStr} ${networkStr} ${typeStr} ${showNameStr} ${episodeInfoStr}`;
    
    return episodeName ? `${headerLine} ${episodeNameStr}` : headerLine;
  }

  /**
   * Format multiple episodes of the same show with no specific airtime
   * @param shows Multiple episodes of the same show
   * @returns Formatted show string with ANSI colors
   */
  public formatMultipleEpisodes(shows: Show[]): string {
    if (!shows.length) {
      return '';
    }

    const firstShow = shows[0];
    const displayTime: string = this.NO_AIRTIME;
    const network: string = this.getNetworkName(firstShow);
    const showName: string = firstShow.show.name || this.UNKNOWN_SHOW;
    const type: string = firstShow.show.type || this.UNKNOWN_TYPE;
    
    // Format header components with consistent padding
    const timeStr: string = chalk.dim(displayTime.padEnd(this.PAD_LENGTHS.time));
    const networkStr: string = chalk.bold.cyan(network.padEnd(this.PAD_LENGTHS.network));
    const typeStr: string = chalk.magenta(type.padEnd(this.PAD_LENGTHS.type));
    const showNameStr: string = chalk.green(showName.padEnd(this.PAD_LENGTHS.showName));
    const episodeInfoStr: string = chalk.yellow(
      this.MULTIPLE_EPISODES.padEnd(this.PAD_LENGTHS.episodeInfo)
    );

    // Create the header line
    const headerLine = `${timeStr} ${networkStr} ${typeStr} ${showNameStr} ${episodeInfoStr}`;
    
    // Calculate padding for episode lines
    const timePad = this.PAD_LENGTHS.time + 1; // time + space
    const networkPad = this.PAD_LENGTHS.network + 1; // network + space
    const typePad = this.PAD_LENGTHS.type + 1; // type + space
    const totalPadding = timePad + networkPad + typePad;
    
    const episodeLines = shows.map(show => {
      const episodeInfo: string = `S${show.season}E${show.number}`;
      const episodeName: string = show.name || '';
      const padding = ' '.repeat(totalPadding);
      const paddedEpisodeInfo = chalk.yellow(episodeInfo.padEnd(this.PAD_LENGTHS.episodeInfo));
      return `${padding} ${paddedEpisodeInfo} ${chalk.dim(episodeName)}`;
    });

    // Combine header and episode lines
    return [headerLine, ...episodeLines].join('\n');
  }

  /**
   * Format a group of shows by network
   * @param networkGroups Shows grouped by network
   * @param timeSort Whether to sort shows by time
   * @returns Array of formatted strings for console output
   */
  public formatNetworkGroups(
    networkGroups: Record<string, Show[]>,
    timeSort: boolean = false
  ): string[] {
    const output: string[] = [];

    for (const [network, shows] of Object.entries(networkGroups)) {
      output.push(`\n${network}:`);
      
      // Sort shows by time if requested
      const displayShows = timeSort ? sortShowsByTime(shows) : shows;
      
      for (const show of displayShows) {
        output.push(this.formatShow(show));
      }
    }

    return output;
  }

  /**
   * Get the network name from a show
   * @param show Show to get network name from
   * @returns Network name or fallback
   */
  private getNetworkName(show: Show): string {
    return (show.show.network?.name !== undefined && show.show.network?.name !== '') 
      ? show.show.network.name 
      : this.UNKNOWN_NETWORK;
  }

  /**
   * Format a time string for display
   * @param time Time string in HH:MM format
   * @returns Formatted time string
   */
  private formatTime(time: string): string {
    return time || this.NO_AIRTIME;
  }
}
