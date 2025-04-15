# Implementation Plan: Issue #91 - Fix Multiple Episode Display and Debug Output in Slack

## Overview

This document provides a detailed implementation plan for GitHub issue #91, which addresses two issues with the Slack integration:

1. The formatting for multiple episodes of the same show isn't working correctly
2. Debug output is being sent to the console in production mode

Based on our analysis of the codebase, we'll also implement some architectural improvements to ensure consistent behavior across output services.

## Pre-Development Steps

1. **Verify the issue**
   - Run the Slack integration with shows that have multiple episodes
   - Confirm that multiple episodes aren't properly grouped
   - Verify that debug output appears in the console

2. **Understand related components**
   - Review `SlackShowFormatterImpl.formatMultipleEpisodes` method
   - Examine `SlackShowFormatterImpl.formatNetwork` method
   - Review `slack.ts` for debug output configuration
   - Check `utils/showUtils.js` for episode formatting utilities

## Implementation Steps

### 1. Update ConfigService

Add/expose methods for date and debug mode configuration:

```typescript
// Update ConfigService to expose these methods
export interface ConfigService {
  // Existing methods...
  
  /**
   * Get the date to use for TV show display
   * Returns current date if not explicitly set
   */
  getDate(): Date;
  
  /**
   * Check if debug mode is enabled
   */
  isDebugMode(): boolean;
}

// Implementation
export class ConfigServiceImpl implements ConfigService {
  // Existing implementation...
  
  public getDate(): Date {
    const dateArg = this.getDateArg();
    return dateArg ? new Date(dateArg) : new Date();
  }
  
  public isDebugMode(): boolean {
    // First check if we're in CLI mode
    if (this.getCliOptions().active) {
      return this.getCliOptions().debug ?? false;
    }
    
    // Otherwise check Slack mode
    return this.getSlackOptions().debug ?? false;
  }
}
```

### 2. Implement BaseOutputService

Create an abstract base class that implements the template method pattern:

```typescript
export abstract class BaseOutputService implements OutputService {
  constructor(
    protected readonly showFormatter: ShowFormatter<unknown>,
    protected readonly configService: ConfigService,
    // Other dependencies as needed
  ) {}

  // Template method pattern for consistent workflow
  public async renderOutput(shows: Show[]): Promise<void> {
    try {
      const date = this.configService.getDate();
      const isDebugMode = this.configService.isDebugMode();
      
      // Common preprocessing logic
      const networkGroups = groupShowsByNetwork(shows);
      const sortedNetworkGroups = sortNetworkGroups(networkGroups);
      
      // Debug output if enabled
      if (isDebugMode) {
        await this.renderDebugInfo(shows, date);
      }
      
      // Abstract methods to be implemented by subclasses
      await this.renderHeader(date);
      await this.renderContent(sortedNetworkGroups);
      await this.renderFooter();
    } catch (error) {
      await this.handleError(error);
    }
  }
  
  // Abstract methods that each implementation must provide
  protected abstract renderHeader(date: Date): Promise<void>;
  protected abstract renderContent(networkGroups: NetworkGroups): Promise<void>;
  protected abstract renderFooter(): Promise<void>;
  protected abstract renderDebugInfo(shows: Show[], date: Date): Promise<void>;
  protected abstract handleError(error: unknown): Promise<void>;
}
```

### 3. Update SlackOutputServiceImpl

Refactor the Slack implementation to extend the BaseOutputService:

```typescript
@injectable()
export class SlackOutputServiceImpl extends BaseOutputService {
  constructor(
    @inject('ConfigService') configService: ConfigService,
    @inject('SlackShowFormatter') private slackFormatter: SlackShowFormatter,
    @inject('SlackClient') private slackClient: SlackClient,
    @inject('Logger') private logger: Logger
  ) {
    super(slackFormatter, configService);
  }
  
  protected async renderHeader(date: Date): Promise<void> {
    // No separate header for Slack - will be part of the message
  }
  
  protected async renderContent(networkGroups: NetworkGroups): Promise<void> {
    const date = this.configService.getDate();
    const blocks = this.slackFormatter.formatNetworkGroups(networkGroups);
    
    await this.slackClient.sendMessage({
      channel: this.configService.getSlackOptions().channelId,
      text: `TV Shows for ${formatDate(date)}`,
      blocks
    });
  }
  
  protected async renderFooter(): Promise<void> {
    // No separate footer for Slack
  }
  
  protected async renderDebugInfo(shows: Show[], date: Date): Promise<void> {
    // Debug info goes to logger instead of Slack channel
    this.logger.debug(`Rendering ${shows.length} shows for ${formatDate(date)}`);
    this.logger.debug(`Shows: ${JSON.stringify(shows, null, 2)}`);
  }
  
  protected async handleError(error: unknown): Promise<void> {
    this.logger.error('Error in Slack output service', error);
    // Optional: Send error notification to Slack if desired
  }
}
```

### 4. Fix SlackShowFormatterImpl for Multiple Episodes

Update the implementation to correctly handle multiple episodes:

```typescript
@injectable()
export class SlackShowFormatterImpl implements SlackShowFormatter {
  // Existing implementation...
  
  public formatMultipleEpisodes(episodes: Episode[]): string {
    if (!episodes || episodes.length === 0) {
      return '';
    }
    
    if (episodes.length === 1) {
      return this.formatEpisode(episodes[0]);
    }
    
    // Group consecutive episodes for better display
    const sortedEpisodes = [...episodes].sort((a, b) => a.number - b.number);
    const ranges: { start: Episode; end: Episode }[] = [];
    
    let currentRange: { start: Episode; end: Episode } | null = null;
    
    for (const episode of sortedEpisodes) {
      if (!currentRange) {
        currentRange = { start: episode, end: episode };
        continue;
      }
      
      // Check if this episode is consecutive to the previous one
      if (episode.number === currentRange.end.number + 1) {
        currentRange.end = episode;
      } else {
        // Start a new range
        ranges.push(currentRange);
        currentRange = { start: episode, end: episode };
      }
    }
    
    // Don't forget the last range
    if (currentRange) {
      ranges.push(currentRange);
    }
    
    // Format each range
    return ranges.map(range => {
      if (range.start.number === range.end.number) {
        return this.formatEpisode(range.start);
      }
      return `S${range.start.season}E${range.start.number}-E${range.end.number}`;
    }).join(', ');
  }
}
```

### 5. Update Slack Configuration

Ensure the debug flag is properly defined in the Slack configuration:

```typescript
// In the config schema
export interface SlackOptions {
  active: boolean;
  channelId: string;
  token: string;
  debug?: boolean;
}

// In .env.example
SLACK_DEBUG=false
```

## Testing Strategy

### Unit Tests

1. **ConfigService Tests**:
   - Test `getDate()` and `isDebugMode()` methods

2. **BaseOutputService Tests**:
   - Create a mock implementation of BaseOutputService
   - Test the template method pattern and error handling

3. **SlackOutputServiceImpl Tests**:
   - Test that the right methods are called based on debug mode
   - Mock dependencies to verify interactions

4. **SlackShowFormatterImpl Tests**:
   - Focus on testing the `formatMultipleEpisodes` method
   - Test different combinations of episodes

### Integration Tests

1. Create integration tests that verify the full output workflow using mock data
2. Test both debug and non-debug modes

## Deployment Plan

1. Create a feature branch for the implementation
2. Implement and test each component
3. Create a pull request with detailed description of changes
4. After review, merge into main branch

## Rollback Strategy

If issues are discovered after deployment:
1. Revert to the previous implementation
2. Isolate and fix the problem in a new branch
3. Re-deploy with fixes
