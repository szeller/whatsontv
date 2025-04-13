# Implementation Plan: Issue #90 - Fix Date Handling in Slack and Console Output

## Overview

This document provides a detailed implementation plan for GitHub issue #90, which addresses several issues with date handling in both the Slack and Console output implementations:

1. The Slack formatter doesn't use the date from command line arguments and always uses the current date
2. The Console version doesn't output the date fetched to the console anymore
3. The date filtering configuration isn't being properly utilized when filtering shows by date

This implementation plan builds on the architecture improvements proposed in [output-service-refactoring.md](/Users/szeller/dev/whatsontv/docs/development/output-service-refactoring.md) and assumes that issue #91's implementation plan has been completed first.

## Pre-Development Steps

1. **Verify the issue**
   - Run the application with a specific date parameter
   - Confirm that Slack always displays today's date instead of the specified date
   - Verify that console output doesn't show the date being used for the query

2. **Understand related components**
   - Review `SlackShowFormatterImpl.formatNetworkGroups` method
   - Examine `SlackOutputServiceImpl.renderOutput` method
   - Check `ConsoleOutputServiceImpl` for date display issues
   - Review `ConfigService` to understand how dates are stored and retrieved

## Implementation Steps

### 1. Update ConfigService Date Methods

Ensure ConfigService exposes clear date methods:

```typescript
// In ConfigService interface
export interface ConfigService {
  // Existing methods...
  
  /**
   * Get the date to use for TV show display
   * Returns current date if not explicitly set
   */
  getDate(): Date;
  
  /**
   * Format a date using the application's standard date format
   */
  formatDate(date: Date): string;
}

// In ConfigServiceImpl
export class ConfigServiceImpl implements ConfigService {
  // Existing implementation...
  
  public getDate(): Date {
    const dateArg = this.getDateArg();
    return dateArg ? new Date(dateArg) : new Date();
  }
  
  public formatDate(date: Date): string {
    return formatDate(date); // Use the existing formatDate utility
  }
}
```

### 2. Update Date Handling in BaseOutputService

The BaseOutputService (implemented in issue #91) should get the date from ConfigService and pass it to child classes:

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
      // Get date from ConfigService - standardized approach
      const date = this.configService.getDate();
      const isDebugMode = this.configService.isDebugMode();
      
      // Common preprocessing logic
      const networkGroups = groupShowsByNetwork(shows);
      const sortedNetworkGroups = sortNetworkGroups(networkGroups);
      
      // Always display date in header
      await this.renderHeader(date);
      
      // Debug output if enabled
      if (isDebugMode) {
        await this.renderDebugInfo(shows, date);
      }
      
      // Render main content
      await this.renderContent(sortedNetworkGroups, date);
      await this.renderFooter();
    } catch (error) {
      await this.handleError(error);
    }
  }
  
  // Updated abstract methods to ensure date is passed
  protected abstract renderHeader(date: Date): Promise<void>;
  protected abstract renderContent(networkGroups: NetworkGroups, date: Date): Promise<void>;
  protected abstract renderFooter(): Promise<void>;
  protected abstract renderDebugInfo(shows: Show[], date: Date): Promise<void>;
  protected abstract handleError(error: unknown): Promise<void>;
}
```

### 3. Update ConsoleOutputServiceImpl

Ensure the Console implementation displays the date:

```typescript
@injectable()
export class ConsoleOutputServiceImpl extends BaseOutputService {
  constructor(
    @inject('ConfigService') configService: ConfigService,
    @inject('TextShowFormatter') private textFormatter: TextShowFormatter,
    @inject('ConsoleOutput') private consoleOutput: ConsoleOutput
  ) {
    super(textFormatter, configService);
  }
  
  protected async renderHeader(date: Date): Promise<void> {
    // Display application name, version
    const appHeader = `WhatsOnTV v${APP_VERSION}`;
    this.consoleOutput.log(appHeader);
    this.consoleOutput.log(this.createSeparator());
    
    // Always display date being used
    this.consoleOutput.log(`Shows for ${this.configService.formatDate(date)}`);
    this.consoleOutput.log('');
  }
  
  protected async renderContent(networkGroups: NetworkGroups, date: Date): Promise<void> {
    // Format the shows using the formatter
    const formattedOutput = this.textFormatter.formatNetworkGroups(networkGroups);
    
    // Display the formatted output
    for (const line of formattedOutput) {
      this.consoleOutput.log(line);
    }
  }
  
  // Implement other required methods...
}
```

### 4. Update SlackOutputServiceImpl

Ensure the Slack implementation displays the date:

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
  
  protected async renderContent(networkGroups: NetworkGroups, date: Date): Promise<void> {
    // Format shows using the formatter
    const blocks = this.slackFormatter.formatNetworkGroups(networkGroups);
    
    // Create a header block with the date
    const headerBlock: SlackHeaderBlock = {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `📺 TV Shows for ${this.configService.formatDate(date)}`,
        emoji: true
      }
    };
    
    // Add the header block to the beginning of the blocks array
    blocks.unshift(headerBlock);
    
    // Add context with show count
    const totalShows = Object.values(networkGroups).reduce(
      (count, shows) => count + shows.length, 
      0
    );
    
    const contextBlock: SlackContextBlock = {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Found *${totalShows}* shows airing on ${this.configService.formatDate(date)}`
        }
      ]
    };
    
    blocks.splice(1, 0, contextBlock);
    
    // Send to Slack
    await this.slackClient.sendMessage({
      channel: this.configService.getSlackOptions().channelId,
      text: `TV Shows for ${this.configService.formatDate(date)}`,
      blocks
    });
  }
  
  // Implement other required methods...
}
```

### 5. Update Date Utility Functions

Centralize date formatting in a utilities file:

```typescript
// src/utils/dateUtils.ts
/**
 * Format a date in the standard application format
 * @param date The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a time with AM/PM period
 * @param time Time string in format "HH:MM"
 * @returns Formatted time with period
 */
export function formatTimeWithPeriod(time: string): string {
  // ... existing implementation
}
```

## Testing Strategy

### Unit Tests

1. **ConfigService Tests**:
   - Test `getDate()` and `formatDate()` methods
   - Verify date argument is properly processed

2. **OutputService Tests**:
   - Test that date is properly displayed in headers
   - Verify correct date formatting is used

3. **Console Output Tests**:
   - Test that the date is displayed in the console output
   - Verify formatting is consistent

4. **Slack Output Tests**:
   - Test that the date is included in the Slack message
   - Verify it appears in both the header and context blocks

### Integration Tests

1. Create tests that verify the full output workflow with different date arguments
2. Test the display consistency between Console and Slack outputs

## Deployment Plan

1. Implement issue #91 first (BaseOutputService and ConfigService improvements)
2. Create a feature branch for issue #90 implementation
3. Make the changes outlined above
4. Run all tests to ensure correct behavior
5. Submit a pull request with detailed description

## Rollback Strategy

If issues are discovered after deployment:
1. Revert to the previous implementation
2. Isolate and fix the problem in a new branch
3. Re-deploy with fixes

## Timeline Estimation

- **ConfigService updates**: 1 hour
- **BaseOutputService updates**: 1 hour (if not already done)
- **ConsoleOutputServiceImpl updates**: 1 hour
- **SlackOutputServiceImpl updates**: 1 hour
- **Date utility updates**: 30 minutes
- **Unit tests**: 2 hours
- **Integration tests**: 1 hour
- **Manual testing and tweaks**: 1 hour

Total: 8 hours

## Dependencies

- This implementation plan builds on the architecture introduced in issue #91
- If issue #91 hasn't been implemented yet, the BaseOutputService will need to be created first
- The date handling improvements in ConfigService should be done early to support the output services
