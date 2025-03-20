import chalk from 'chalk';

import type { Show } from '../types/tvmaze.js';

/**
 * Format show details for display in a consistent, readable format.
 * Includes time, network, type, show name, episode info, and episode name.
 * @param show Show to format
 * @returns Formatted string with ANSI colors
 */
export function formatShowDetails(show: Show): string {
  const displayTime: string = show.airtime || 'TBA';
  const network: string = (show.show.network?.name !== undefined && show.show.network.name !== '') 
    ? show.show.network.name 
    : ((show.show.webChannel?.name !== undefined && show.show.webChannel.name !== '') 
      ? show.show.webChannel.name 
      : 'N/A');
  const episodeInfo: string = `S${show.season}E${show.number}`;
  const showName: string = show.show.name || 'Unknown Show';
  const episodeName: string = show.name || '';
  const type: string = show.show.type || 'Unknown';

  // Format each component with consistent padding
  const timeStr: string = chalk.dim(displayTime.padEnd(6));
  const networkStr: string = chalk.bold.cyan(network.padEnd(19));
  const typeStr: string = chalk.magenta(type.padEnd(11));
  const showNameStr: string = chalk.green(showName.padEnd(34));
  const episodeInfoStr: string = chalk.yellow(episodeInfo.padEnd(9));
  const episodeNameStr: string = chalk.dim(episodeName);

  // Combine all components with consistent spacing
  return `${timeStr} ${networkStr} ${typeStr} ${showNameStr} ${episodeInfoStr} ${episodeNameStr}`;
}
