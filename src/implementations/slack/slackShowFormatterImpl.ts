import 'reflect-metadata';
import { injectable } from 'tsyringe';

import type { SlackShowFormatter } from '../../interfaces/showFormatter.js';
import type { Show } from '../../schemas/domain.js';
import type {
  SlackBlock,
  SlackSectionBlock,
  SlackHeaderBlock,
  SlackContextBlock
} from '../../interfaces/slackClient.js';
import { formatTimeWithPeriod } from '../../utils/dateUtils.js';
import { BaseShowFormatterImpl } from '../baseShowFormatterImpl.js';
import {
  groupShowsByShowId,
  hasAirtime,
  allShowsHaveNoAirtime
} from '../../utils/formatUtils.js';
import { sortShowsByTime } from '../../utils/showUtils.js';

/**
 * Formats TV show data into Slack message blocks using compact context blocks
 */
@injectable()
export class SlackShowFormatterImpl extends BaseShowFormatterImpl<SlackBlock>
  implements SlackShowFormatter {

  /**
   * Format a show with a specific airtime as a bullet point string
   * @param show Show with a specific airtime
   * @returns Formatted show as bullet point string
   */
  public formatTimedShow(show: Show): SlackSectionBlock {
    // This method is required by the interface but we use formatShowAsBullet instead
    const text = this.formatShowAsBullet(show);
    return {
      type: 'section',
      text: { type: 'mrkdwn', text }
    };
  }

  /**
   * Format a show with no specific airtime as a bullet point string
   * @param show Show with no specific airtime
   * @returns Formatted show as bullet point string
   */
  public formatUntimedShow(show: Show): SlackSectionBlock {
    // This method is required by the interface but we use formatShowAsBullet instead
    const text = this.formatShowAsBullet(show);
    return {
      type: 'section',
      text: { type: 'mrkdwn', text }
    };
  }

  /**
   * Format multiple episodes of the same show
   * @param shows Multiple episodes of the same show
   * @returns Formatted show representations as Slack blocks
   */
  public formatMultipleEpisodes(shows: Show[]): SlackBlock[] {
    if (!shows?.length) {
      return [{
        type: 'section',
        text: { type: 'mrkdwn', text: 'No episodes found' }
      }];
    }

    const text = this.formatMultipleEpisodesAsBullet(shows);
    return [{
      type: 'section',
      text: { type: 'mrkdwn', text }
    }];
  }

  /**
   * Format a single network and its shows as a compact context block
   * @param network Network name
   * @param shows Shows in the network
   * @returns Single context block with network and all shows
   */
  public override formatNetwork(network: string, shows: Show[]): SlackBlock[] {
    if (!Array.isArray(shows) || shows.length === 0) {
      return this.formatEmptyNetwork(network);
    }

    const formattedNetwork = this.formatNetworkName(network);
    const showLines = this.formatShowsAsBulletList(shows);

    const contextBlock: SlackContextBlock = {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `:tv: *${formattedNetwork}*\n${showLines}`
        }
      ]
    };

    return [contextBlock];
  }

  /**
   * Format all shows for a network as a bullet list
   * @param shows Shows to format
   * @returns Bullet list string
   */
  private formatShowsAsBulletList(shows: Show[]): string {
    const sortedShows = sortShowsByTime(shows);
    const showGroups = groupShowsByShowId(sortedShows);
    const processedShowIds = new Set<string>();
    const bullets: string[] = [];

    for (const show of sortedShows) {
      const showId = show.id.toString();
      if (processedShowIds.has(showId)) {
        continue;
      }

      const showGroup = showGroups[showId];
      if (showGroup === undefined) {
        continue;
      }

      processedShowIds.add(showId);

      if (showGroup.length === 1) {
        bullets.push(this.formatShowAsBullet(show));
      } else if (allShowsHaveNoAirtime(showGroup)) {
        bullets.push(this.formatMultipleEpisodesAsBullet(showGroup));
      } else {
        const sortedEpisodes = sortShowsByTime(showGroup);
        for (const episode of sortedEpisodes) {
          bullets.push(this.formatShowAsBullet(episode));
        }
      }
    }

    return bullets.join('\n');
  }

  /**
   * Format a single show as a bullet point
   * @param show Show to format
   * @returns Bullet point string
   */
  private formatShowAsBullet(show: Show): string {
    const components = this.prepareShowComponents(show);
    const hasAirtimeValue = hasAirtime(show);

    if (hasAirtimeValue) {
      const airtime = formatTimeWithPeriod(show.airtime);
      return `• ${components.showName} ${components.episodeInfo} (${airtime})`;
    }
    return `• ${components.showName} ${components.episodeInfo}`;
  }

  /**
   * Format multiple episodes as a single bullet point with episode range
   * @param shows Episodes to format
   * @returns Bullet point string
   */
  private formatMultipleEpisodesAsBullet(shows: Show[]): string {
    if (!shows?.length) {
      return '• No episodes found';
    }

    const sortedEpisodes = this.sortEpisodesByNumber(shows);
    const firstShow = sortedEpisodes[0];
    const components = this.prepareShowComponents(firstShow);

    const allSameSeason = sortedEpisodes.every(
      (show) => show.season === sortedEpisodes[0].season
    );

    if (allSameSeason && sortedEpisodes.length > 1) {
      const firstEp = sortedEpisodes[0];
      const lastEp = sortedEpisodes[sortedEpisodes.length - 1];

      if (lastEp.number && firstEp.number &&
          lastEp.number - firstEp.number === sortedEpisodes.length - 1) {
        const season = `S${String(firstEp.season).padStart(2, '0')}`;
        const firstEpNum = String(firstEp.number).padStart(2, '0');
        const lastEpNum = String(lastEp.number).padStart(2, '0');

        const hasAirtimeValue = shows.some(show => hasAirtime(show));
        const airtime = hasAirtimeValue
          ? ` (${formatTimeWithPeriod(firstEp.airtime)})`
          : '';

        return `• ${components.showName} ${season}E${firstEpNum}-${lastEpNum}${airtime}`;
      }
    }

    // If not consolidated, return individual bullets joined
    return sortedEpisodes
      .map(show => this.formatShowAsBullet(show))
      .join('\n');
  }

  /**
   * Format the header for network display (not used in compact format)
   * @param _network The network name
   * @returns Empty array - network header is part of context block
   */
  protected formatNetworkHeader(_network: string): SlackBlock[] {
    return [];
  }

  /**
   * Format content for an empty network
   * @param network The network name
   * @returns Formatted empty network content
   */
  protected formatEmptyNetwork(network: string): SlackBlock[] {
    const formattedNetwork = this.formatNetworkName(network);

    const contextBlock: SlackContextBlock = {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `:tv: *${formattedNetwork}*\n• No shows found`
        }
      ]
    };

    return [contextBlock];
  }

  /**
   * Format the header content for the network groups
   * @returns Formatted header content
   */
  protected formatHeader(): SlackBlock[] {
    const headerBlock: SlackHeaderBlock = {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'Shows by Network',
        emoji: true
      }
    };

    return [headerBlock];
  }

  /**
   * Format the footer content for the network groups
   * @returns Formatted footer content
   */
  protected formatFooter(): SlackBlock[] {
    const footerBlock: SlackContextBlock = {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '_Data provided by TVMaze API_'
        }
      ]
    };

    return [footerBlock];
  }

  /**
   * Format separator between networks
   * @returns Empty array - no separators in compact format
   */
  protected formatNetworkSeparator(): SlackBlock[] {
    return [];
  }
}
