# Slack Integration Technical Design

## Overview

This document outlines the technical design for implementing a Slack integration for WhatsOnTV. The integration will run as a scheduled service that sends TV show listings to a Slack channel once per day.

## Goals

1. Create a new entry point separate from the CLI application
2. Implement a Slack-specific output format that balances utility and readability
3. Separate message construction from Slack API interaction for better testability
4. Organize code to maximize reuse and maintainability 
5. Support scheduled execution for daily updates
6. Maintain consistency with existing architectural patterns

## Architecture

The Slack integration will follow the existing application's clean architecture principles, maintaining the same separation of concerns pattern used in the console implementation:

```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│                │      │                │      │                │
│   Entry Point  │──►   │   Services     │──►   │ Implementations│
│   (slack.ts)   │      │   (interfaces) │      │   (concrete)   │
│                │      │                │      │                │
└────────────────┘      └────────────────┘      └────────────────┘
                              │   ▲
                              ▼   │
                        ┌────────────────┐
                        │                │
                        │    Utilities   │
                        │                │
                        └────────────────┘
```

The implementation will use the same interface hierarchy as the console implementation:
- `OutputService` → `SlackOutputServiceImpl` (renders the complete output)
- `ShowFormatter` → `SlackFormatterImpl` (formats shows for Slack)
- Additional supporting services for Slack-specific operations

## New Components

### 1. Entry Point

```typescript
// src/slack.ts
import { container } from './container.js';
import { SlackApplication } from './applications/slackApplication.js';

async function main(): Promise<void> {
  const app = SlackApplication.createFromContainer(container);
  await app.run();
}

// Run when called directly
if (import.meta.url.startsWith('file:') && 
    process.argv[1] === import.meta.url.substring(7)) {
  main().catch((error) => {
    console.error('Unhandled error in Slack application:', error);
    process.exit(1);
  });
}
```

### 2. Application Class

```typescript
// src/applications/slackApplication.ts
import { type DependencyContainer } from 'tsyringe';
import type { ConfigService } from '../interfaces/configService.js';
import type { TvShowService } from '../interfaces/tvShowService.js';
import type { OutputService } from '../interfaces/outputService.js';

export class SlackApplication {
  private _configService: ConfigService;
  private _tvShowService: TvShowService;
  private _outputService: OutputService;
  
  constructor(
    configService: ConfigService,
    tvShowService: TvShowService,
    outputService: OutputService
  ) {
    this._configService = configService;
    this._tvShowService = tvShowService;
    this._outputService = outputService;
  }
  
  public async run(): Promise<void> {
    try {
      // Get shows
      const shows = await this._tvShowService.fetchShows();
      
      // Use the OutputService to handle all rendering aspects
      await this._outputService.renderOutput(shows);
      
      return;
    } catch (error) {
      console.error('Error in Slack application:', error);
      throw error;
    }
  }
  
  public static createFromContainer(container: DependencyContainer): SlackApplication {
    return new SlackApplication(
      container.resolve<ConfigService>('ConfigService'),
      container.resolve<TvShowService>('TvShowService'),
      container.resolve<OutputService>('SlackOutputService') // Named registration for this specific implementation
    );
  }
}
```

### 3. Slack Output Service Implementation

```typescript
// src/implementations/slack/slackOutputServiceImpl.ts
import { inject, injectable } from 'tsyringe';
import type { OutputService } from '../../interfaces/outputService.js';
import type { ShowFormatter } from '../../interfaces/showFormatter.js';
import type { ConfigService } from '../../interfaces/configService.js';
import type { SlackClient } from '../../interfaces/slackClient.js';
import type { Show } from '../../schemas/domain.js';
import type { NetworkGroups } from '../../schemas/domain.js';
import { groupShowsByNetwork } from '../../utils/showUtils.js';

/**
 * Slack implementation of the OutputService interface
 * Sends TV show information to a Slack channel
 */
@injectable()
export class SlackOutputServiceImpl implements OutputService {
  protected formatter: ShowFormatter;
  protected slackClient: SlackClient;
  protected configService: ConfigService;

  constructor(
    @inject('SlackFormatter') formatter: ShowFormatter,
    @inject('SlackClient') slackClient: SlackClient,
    @inject('ConfigService') configService: ConfigService
  ) {
    this.formatter = formatter;
    this.slackClient = slackClient;
    this.configService = configService;
  }

  /**
   * Execute the complete output workflow for Slack
   * @param shows The TV shows to display
   */
  public async renderOutput(shows: Show[]): Promise<void> {
    try {
      // Get Slack configuration options
      const slackOptions = this.configService.getSlackOptions();
      const channelId = slackOptions.channelId;
      
      // Create header
      const header = this.createHeader(shows.length);
      
      // Group shows by network
      const networkGroups = groupShowsByNetwork(shows);
      
      // Format shows by network using the formatter
      const formattedShows = this.formatter.formatNetworkGroups(
        networkGroups,
        true // Sort by time
      );
      
      // Create footer
      const footer = this.createFooter();
      
      // Combine all sections
      const message = [
        ...header,
        ...formattedShows,
        ...footer
      ].join('\n');
      
      // Send to Slack
      await this.slackClient.sendMessage({
        channel: channelId,
        text: message,
        // Convert to Slack blocks format
        blocks: this.convertToSlackBlocks(message)
      });
    } catch (error) {
      console.error('Error rendering Slack output:', error);
      
      // Attempt to send error message
      try {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
          
        await this.slackClient.sendMessage({
          channel: this.configService.getSlackOptions().channelId,
          text: `Error fetching TV shows: ${errorMessage}`
        });
      } catch {
        // If sending the error message also fails, just log to console
        console.error('Failed to send error message to Slack');
      }
      
      throw error;
    }
  }
  
  /**
   * Create header lines for the Slack message
   * @param showCount Number of shows found
   * @returns Array of header lines
   * @private
   */
  private createHeader(showCount: number): string[] {
    const date = new Date();
    const options = {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    } as const;
    
    const formattedDate = date.toLocaleDateString('en-US', options);
    
    return [
      `*📺 TV Shows for ${formattedDate}*`,
      `Found *${showCount}* shows airing today`,
      '---'
    ];
  }
  
  /**
   * Create footer lines for the Slack message
   * @returns Array of footer lines
   * @private
   */
  private createFooter(): string[] {
    return [
      '---',
      '_Data provided by TVMaze API (https://api.tvmaze.com)_'
    ];
  }
  
  /**
   * Convert text message to Slack blocks format
   * This is a utility method to transform formatted text into Slack's Block Kit format
   * @param message The formatted message text
   * @returns Slack blocks array
   * @private
   */
  private convertToSlackBlocks(message: string): unknown[] {
    // This is a simplified example - in the actual implementation,
    // we would parse the text and convert to appropriate Slack blocks
    const lines = message.split('\n');
    const blocks = [];
    
    // Convert lines to blocks (simplified example)
    for (const line of lines) {
      if (line.startsWith('*📺')) {
        // Main header
        blocks.push({
          type: 'header',
          text: {
            type: 'plain_text',
            text: line.replace(/\*/g, ''),
            emoji: true
          }
        });
      } else if (line.startsWith('Found *')) {
        // Show count context
        blocks.push({
          type: 'context',
          elements: [{
            type: 'mrkdwn',
            text: line
          }]
        });
      } else if (line === '---') {
        // Divider
        blocks.push({
          type: 'divider'
        });
      } else if (line.startsWith('_Data provided by')) {
        // Footer
        blocks.push({
          type: 'context',
          elements: [{
            type: 'mrkdwn',
            text: line
          }]
        });
      } else if (line.endsWith(':')) {
        // Network header
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${line.replace(':', '')}*`
          }
        });
      } else if (line.trim() !== '') {
        // Show content
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: line
          }
        });
      }
    }
    
    return blocks;
  }
}
```

### 4. Slack Formatter Implementation

```typescript
// src/implementations/slack/slackFormatterImpl.ts
import { inject, injectable } from 'tsyringe';
import type { ShowFormatter } from '../../interfaces/showFormatter.js';
import type { StyleService } from '../../interfaces/styleService.js';
import type { TvShowService } from '../../interfaces/tvShowService.js';
import type { ConfigService } from '../../interfaces/configService.js';
import type { Show } from '../../schemas/domain.js';
import type { NetworkGroups } from '../../schemas/domain.js';
import { sortShowsByTime, formatEpisodeRanges } from '../../utils/showUtils.js';

/**
 * Slack implementation of the ShowFormatter interface
 * Formats TV show information for display in Slack
 */
@injectable()
export class SlackFormatterImpl implements ShowFormatter {
  // Constants for formatting
  private readonly UNKNOWN_SHOW = 'Unknown Show';
  private readonly UNKNOWN_TYPE = 'Unknown';
  private readonly NO_AIRTIME = 'N/A';
  private readonly MULTIPLE_EPISODES = 'Multiple Episodes';
  
  constructor(
    @inject('ConfigService') private readonly configService: ConfigService,
    @inject('TvShowService') private readonly tvShowService: TvShowService
  ) {}

  /**
   * Format a single show for display
   * @param show Show to format
   * @returns Formatted show string
   */
  public formatShow(show: Show): string {
    return show.airtime
      ? this.formatTimedShow(show)
      : this.formatUntimedShow(show);
  }
  
  /**
   * Format a show with a specific airtime
   * @param show Show with a specific airtime
   * @returns Formatted show string
   */
  public formatTimedShow(show: Show): string {
    const airtime = show.airtime || this.NO_AIRTIME;
    const network = show.network || 'Unknown';
    const showType = show.type || this.UNKNOWN_TYPE;
    const showName = show.name || this.UNKNOWN_SHOW;
    const episodeInfo = this.formatEpisodeInfo(show);
    
    return `• *${showName}* ${episodeInfo}\n  ${airtime} | ${showType}`;
  }
  
  /**
   * Format a show with no specific airtime (TBA)
   * @param show Show with no specific airtime
   * @returns Formatted show string
   */
  public formatUntimedShow(show: Show): string {
    const network = show.network || 'Unknown';
    const showType = show.type || this.UNKNOWN_TYPE;
    const showName = show.name || this.UNKNOWN_SHOW;
    const episodeInfo = this.formatEpisodeInfo(show);
    
    return `• *${showName}* ${episodeInfo}\n  ${this.NO_AIRTIME} | ${showType}`;
  }
  
  /**
   * Format multiple episodes of the same show with no specific airtime
   * @param shows Multiple episodes of the same show
   * @returns Formatted show strings
   */
  public formatMultipleEpisodes(shows: Show[]): string[] {
    if (!shows.length) return [];
    
    const episodeRanges = formatEpisodeRanges(shows);
    const firstShow = shows[0];
    const showName = firstShow.name || this.UNKNOWN_SHOW;
    const network = firstShow.network || 'Unknown';
    const showType = firstShow.type || this.UNKNOWN_TYPE;
    
    return episodeRanges.map(range => 
      `• *${showName}* ${range}\n  ${this.NO_AIRTIME} | ${showType}`
    );
  }
  
  /**
   * Format a group of shows by network
   * @param networkGroups Shows grouped by network
   * @param timeSort Whether to sort shows by time
   * @returns Formatted output as an array of strings
   */
  public formatNetworkGroups(networkGroups: NetworkGroups, timeSort: boolean = true): string[] {
    const result: string[] = [];
    
    Object.entries(networkGroups).forEach(([network, shows]) => {
      // Skip empty networks
      if (!shows.length) return;
      
      // Add network heading
      result.push(`${network}:`);
      
      // Sort shows if required
      const sortedShows = timeSort ? sortShowsByTime(shows) : shows;
      
      // Add each formatted show
      sortedShows.forEach(show => {
        result.push(this.formatShow(show));
      });
      
      // Add a blank line after each network
      result.push('');
    });
    
    return result;
  }
  
  /**
   * Format episode information for a show
   * @param show The show to format episode info for
   * @returns Formatted episode info string
   * @private
   */
  private formatEpisodeInfo(show: Show): string {
    if (!show.season && !show.number) {
      return '';
    }
    
    const season = show.season ? `S${String(show.season).padStart(2, '0')}` : '';
    const episode = show.number ? `E${String(show.number).padStart(2, '0')}` : '';
    
    return season + episode;
  }
}
```

### 5. Slack Client Interface

```typescript
// src/interfaces/slackClient.ts
import type { SlackMessagePayload } from '../types/slackTypes.js';

/**
 * Interface for a client that can send messages to Slack
 */
export interface SlackClient {
  /**
   * Send a message to Slack
   * @param payload The message payload to send
   * @returns Promise resolving when the message is sent
   */
  sendMessage(payload: SlackMessagePayload): Promise<void>;
}
```

### 6. Slack Client Implementation

```typescript
// src/implementations/slack/slackClientImpl.ts
import { inject, injectable } from 'tsyringe';
import { WebClient } from '@slack/web-api';
import type { SlackClient } from '../../interfaces/slackClient.js';
import type { ConfigService } from '../../interfaces/configService.js';
import type { SlackMessagePayload, SlackOptions } from '../../types/slackTypes.js';

@injectable()
export class SlackClientImpl implements SlackClient {
  private _client: WebClient;
  private _configService: ConfigService;
  private _options: SlackOptions;
  
  constructor(
    @inject('ConfigService') configService: ConfigService
  ) {
    this._configService = configService;
    this._options = this._configService.getSlackOptions();
    this._client = new WebClient(this._options.token);
  }
  
  public async sendMessage(payload: SlackMessagePayload): Promise<void> {
    try {
      // Ensure channel is set
      if (!payload.channel) {
        payload.channel = this._options.channelId;
      }
      
      // Add default username if set in options
      const completePayload = {
        ...payload,
        username: this._options.username,
        icon_emoji: this._options.icon_emoji
      };
      
      // Send the message
      await this._client.chat.postMessage(completePayload);
    } catch (error) {
      console.error('Error sending Slack message:', error);
      throw new Error(`Failed to send Slack message: ${String(error)}`);
    }
  }
}
```

### 7. New Types

```typescript
// src/types/slackTypes.ts
/**
 * Slack Block Element
 */
export interface SlackBlockElement {
  type: string;
  [key: string]: unknown;
}

/**
 * Slack Block
 */
export interface SlackBlock {
  type: string;
  [key: string]: unknown;
}

/**
 * Slack Message Payload
 */
export interface SlackMessagePayload {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
  username?: string;
  icon_emoji?: string;
  [key: string]: unknown;
}

/**
 * Configuration options for Slack
 */
export interface SlackOptions {
  token: string;
  channelId: string;
  username: string;
  icon_emoji?: string;
  dateFormat?: string;
}
```

### 8. Config Service Updates

```typescript
// src/interfaces/configService.ts (update)
import type { ShowOptions } from '../types/tvShowOptions.js';
import type { CliOptions } from '../types/cliOptions.js';
import type { AppConfig } from '../types/appConfig.js';
import type { SlackOptions } from '../types/slackTypes.js';

export interface ConfigService {
  // ... existing methods ...
  
  /**
   * Get Slack configuration options
   * @returns The Slack configuration options
   */
  getSlackOptions(): SlackOptions;
}
```

### 9. Container Registration

```typescript
// src/container.ts (update)
import { container } from 'tsyringe';
// ... existing imports ...
import { SlackOutputServiceImpl } from './implementations/slack/slackOutputServiceImpl.js';
import { SlackFormatterImpl } from './implementations/slack/slackFormatterImpl.js';
import { SlackClientImpl } from './implementations/slack/slackClientImpl.js';

// ... existing registrations ...

// Register Slack services
container.register('SlackFormatter', {
  useClass: SlackFormatterImpl
});

container.register('SlackClient', {
  useClass: SlackClientImpl
});

container.register('SlackOutputService', {
  useClass: SlackOutputServiceImpl
});

export { container };
```

## Testing Strategy

### 1. Unit Tests

#### SlackFormatter Tests
- Test each formatting method with various show data
- Ensure correct Slack markdown formatting is applied
- Use fixture data for consistent test behavior

#### SlackClient Tests 
- Test message sending with mocked WebClient
- Test error handling scenarios
- Test configuration handling

#### SlackOutputService Tests
- Test the rendering workflow with mocked dependencies
- Verify network grouping and sorting
- Test error handling and reporting

### 2. Integration Tests

- Test the complete flow from application entry point to message sending
- Use mock Slack API responses

### 3. Fixture Data

Create realistic fixture data in `src/tests/fixtures/slack`:

```typescript
// src/tests/fixtures/slack/slackMessages.ts
import type { SlackMessagePayload, SlackBlock } from '../../../types/slackTypes.js';

/**
 * Generate a sample Slack message
 * @returns A sample Slack message payload
 */
export function getSampleSlackMessage(): SlackMessagePayload {
  // ... implementation with realistic data
}

/**
 * Generate sample Slack blocks
 * @returns Sample Slack blocks
 */
export function getSampleSlackBlocks(): SlackBlock[] {
  // ... implementation
}
```

## Iteration Strategy

1. **Phase 1: Core Implementation**
   - Implement the SlackFormatter with a basic format
   - Create the SlackClient with API integration
   - Implement the SlackOutputService
   
2. **Phase 2: Testing and Refinement**
   - Add unit tests for all components
   - Create integration tests
   - Refine message format based on feedback
   
3. **Phase 3: Scheduling and Deployment**
   - Add scheduling capabilities
   - Document deployment options

## Scheduling

For scheduled execution, we'll use one of the following approaches:

1. **Node-cron**: Simple in-process scheduling when the application runs continuously
   ```typescript
   import cron from 'node-cron';
   
   // Schedule task to run at 3:00 PM every day
   cron.schedule('0 15 * * *', async () => {
     const app = SlackApplication.createFromContainer(container);
     await app.run();
   });
   ```

2. **External Scheduler**: When deployed, we can use:
   - AWS Lambda + EventBridge
   - GitHub Actions scheduled workflows
   - Traditional crontab on Linux/Unix systems
   - Docker container with scheduled runs

## Implementation Recommendations

1. **Slack API Client**: Use the official `@slack/web-api` package for reliable API integration
2. **Message Format**: Use Slack Blocks API for rich, interactive messages rather than simple text messages
3. **Configuration**: Store Slack API tokens and channel IDs in environment variables
4. **Error Handling**: Implement robust error handling with fallback notification mechanisms
5. **Logging**: Add comprehensive logging for troubleshooting

## Future Enhancements

1. Interactive buttons for filtering shows
2. User preference storage
3. On-demand show information through Slack commands
4. Personalized recommendations

## Dependencies

New dependencies to add:
- `@slack/web-api`: Official Slack API client
- `node-cron`: Optional, for scheduled execution
