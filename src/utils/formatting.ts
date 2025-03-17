import chalk from 'chalk';
import type { Show } from '../types/tvmaze.js';

/**
 * Format show details for display
 */
export function formatShowDetails(show: Show): string {
  const displayTime = show.airtime || 'TBA';
  const network = show.show.network?.name || show.show.webChannel?.name || 'N/A';
  const episodeInfo = `S${show.season}E${show.number}`;
  const showName = show.show.name || 'Unknown Show';
  const episodeName = show.name || '';
  const type = show.show.type || 'Unknown';

  // Format: time network type showName episodeNum episodeName
  return `${chalk.dim(displayTime.padEnd(6))} ${chalk.bold.cyan(network.padEnd(19))} ${chalk.magenta(type.padEnd(11))} ${chalk.green(showName.padEnd(34))} ${chalk.yellow(episodeInfo.padEnd(9))} ${chalk.dim(episodeName)}`;
}
