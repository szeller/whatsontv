#!/usr/bin/env node

/**
 * Slack integration for WhatsOnTV
 * Sends TV show information to Slack
 */

import 'reflect-metadata';
import { container, initializeSlackContainer } from './slackContainer.js';
import type { ConsoleOutput } from './interfaces/consoleOutput.js';
import type { TvShowService } from './interfaces/tvShowService.js';
import type { ConfigService } from './interfaces/configService.js';
import type { SlackShowFormatter } from './interfaces/showFormatter.js';
import type { OutputService } from './interfaces/outputService.js';
import type { Show } from './schemas/domain.js';
import { formatDate } from './utils/dateUtils.js';
import { groupShowsByNetwork } from './utils/showUtils.js';
import { BaseCliApplication, runMain } from './utils/cliBase.js';
import { registerGlobalErrorHandler } from './utils/errorHandling.js';

// Initialize the Slack container
initializeSlackContainer();

// Get ConsoleOutput service for global error handling
const consoleOutput = container.resolve<ConsoleOutput>('ConsoleOutput');

// Register global error handler
registerGlobalErrorHandler(consoleOutput);

/**
 * Slack CLI application implementation
 */
export class SlackCliApplication extends BaseCliApplication {
  /**
   * Create a new SlackCliApplication
   * @param tvShowService Service for fetching TV shows
   * @param configService Service for configuration
   * @param consoleOutput Service for console output
   * @param slackFormatter Service for formatting shows for Slack
   * @param slackOutputService Service for sending messages to Slack
   */
  constructor(
    tvShowService: TvShowService,
    configService: ConfigService,
    consoleOutput: ConsoleOutput,
    private readonly slackFormatter: SlackShowFormatter,
    private readonly slackOutputService: OutputService
  ) {
    super(tvShowService, configService, consoleOutput);
  }
  
  /**
   * Process the fetched shows
   * @param shows The shows to process
   */
  protected async processShows(shows: Show[]): Promise<void> {
    try {
      // Use the Slack output service to send the message
      await this.slackOutputService.renderOutput(shows);
            
      // Get the channel from config
      const channelId = this.configService.getSlackOptions().channelId || 'console-output';
      
      // Group shows by network for console display
      const networkGroups = groupShowsByNetwork(shows);
      
      // Format the shows for console display
      const blocks = this.slackFormatter.formatNetworkGroups(networkGroups);
      
      // Create the full Slack message payload for console display
      const slackPayload = {
        channel: channelId,
        text: `*📺 TV Shows for ${formatDate(this.configService.getDate())}*`, // Fallback text
        blocks
      };
      
      const debug = this.configService.isDebugMode();

      // For development/testing, also output the formatted message to console
      if (debug) {
        this.consoleOutput.log('Successfully sent message to Slack (mock)');
        // Output the formatted JSON to the console
        this.consoleOutput.log('Slack message payload:');
        this.consoleOutput.log(JSON.stringify(slackPayload, null, 2));
      }
    } catch (error) {
      this.consoleOutput.error(`Error processing shows for Slack: ${String(error)}`);
      
      // Re-throw to allow the base class to handle it
      throw error;
    }
  }
}

/**
 * Create a Slack CLI application instance with all required services
 * @returns A new SlackCliApplication instance
 */
export function createSlackApp(): SlackCliApplication {
  try {
    // Resolve all required services from the container
    const tvShowService = container.resolve<TvShowService>('TvShowService');
    const configService = container.resolve<ConfigService>('ConfigService');
    const slackFormatter = container.resolve<SlackShowFormatter>('SlackFormatter');
    const slackOutputService = container.resolve<OutputService>('SlackOutputService');
    
    // Create the Slack CLI application
    return new SlackCliApplication(
      tvShowService,
      configService,
      consoleOutput,
      slackFormatter,
      slackOutputService
    );
  } catch (error) {
    consoleOutput.error(`Error resolving services: ${String(error)}`);
    
    // Check if the error is related to missing service registrations
    if (String(error).includes('SlackFormatter')) {
      consoleOutput.error('The SlackFormatter service is not registered in the container.');
      consoleOutput.error('Please make sure to register it before running this application.');
    } else if (String(error).includes('SlackOutputService')) {
      consoleOutput.error('The SlackOutputService service is not registered in the container.');
      consoleOutput.error('Please make sure to register it before running this application.');
    }
    
    throw error;
  }
}

// Create the Slack app and run it if this file is executed directly
runMain(createSlackApp(), consoleOutput);
