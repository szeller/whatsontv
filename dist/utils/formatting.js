import chalk from 'chalk';
/**
 * Format show details for display
 */
export function formatShowDetails(show) {
    const displayTime = show.airtime || 'TBA';
    const network = show.show.network?.name || show.show.webChannel?.name || 'N/A';
    const episodeInfo = `S${show.season}E${show.number}`;
    const showName = show.show.name || 'Unknown Show';
    const episodeName = show.name || '';
    const type = show.show.type || 'Unknown';
    // Format each component with consistent padding
    const timeStr = chalk.dim(displayTime.padEnd(6));
    const networkStr = chalk.bold.cyan(network.padEnd(19));
    const typeStr = chalk.magenta(type.padEnd(11));
    const showNameStr = chalk.green(showName.padEnd(34));
    const episodeInfoStr = chalk.yellow(episodeInfo.padEnd(9));
    const episodeNameStr = chalk.dim(episodeName);
    // Combine all components
    return `${timeStr} ${networkStr} ${typeStr} ${showNameStr} ${episodeInfoStr} ${episodeNameStr}`;
}
