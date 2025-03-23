import 'reflect-metadata';
import { WebClient } from '@slack/web-api';
import { inject, injectable } from 'tsyringe';
import type { Arguments } from 'yargs';

import config from '../../config.js';
import type { OutputService } from '../../interfaces/outputService.js';
import type { ShowFormatter } from '../../interfaces/showFormatter.js';
import type { TvShowService } from '../../interfaces/tvShowService.js';
import type { CliArgs } from '../../types/cliArgs.js';
import type { Show } from '../../types/tvmaze.js';
import { groupShowsByNetwork } from '../../utils/showUtils.js';

/**
 * Implementation of the OutputService for Slack
 * Handles sending TV show information to Slack channels
 */
@injectable()
export class SlackOutputServiceImpl implements OutputService {
  private client: WebClient | null = null;
  private channel: string | null = null;
  private initialized = false;

  /**
   * Constructor
   * @param formatter Formatter for TV show information
   * @param tvShowService Service for TV show operations
   */
  constructor(
    @inject('SlackFormatter') private readonly formatter: ShowFormatter,
    @inject('TvShowService') private readonly tvShowService: TvShowService
  ) {}

  /**
   * Initialize the Slack client
   * @returns Promise resolving to true if initialization was successful
   */
  private async initialize(): Promise<boolean> {
    const token = process.env.SLACK_TOKEN;
    if (token === undefined || token === null || token === '') {
      console.error('SLACK_TOKEN environment variable is not set');
      return false;
    }

    const channel = process.env.SLACK_CHANNEL;
    if (channel === undefined || channel === null || channel === '') {
      console.error('SLACK_CHANNEL environment variable is not set');
      return false;
    }

    try {
      this.client = new WebClient(token);
      this.channel = channel;
      
      // Perform an async operation to validate the token and channel
      // This ensures we're properly using await in this async method
      const authResult = await this.client.auth.test();
      if (!authResult.ok) {
        console.error('Slack authentication failed:', authResult.error);
        return false;
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Slack client:', error);
      return false;
    }
  }

  /**
   * Check if the service is properly initialized
   * @returns True if initialized, false otherwise
   */
  public isInitialized(): boolean {
    return this.initialized && this.client !== null && this.channel !== null;
  }

  /**
   * Display application header
   */
  public displayHeader(): void {
    void this.sendMessage(`*${config.appName} v${config.version}*`);
  }

  /**
   * Display application footer
   */
  public displayFooter(): void {
    void this.sendMessage(`\n_Data provided by TVMaze API (${config.apiUrl})_`);
  }

  /**
   * Display TV shows in Slack
   * @param shows Shows to display
   * @param timeSort Whether to sort shows by time
   * @returns Promise resolving when shows have been sent
   */
  public async displayShows(shows: Show[], timeSort = false): Promise<void> {
    if (!this.isInitialized()) {
      const initSuccess = await this.initialize();
      if (!initSuccess) {
        console.error('Failed to initialize Slack client');
        return;
      }
    }

    this.displayHeader();

    if (shows.length === 0) {
      await this.sendMessage('No shows found for the specified criteria.');
      this.displayFooter();
      return;
    }

    const networkGroups = groupShowsByNetwork(shows);
    const formattedOutput = this.formatter.formatNetworkGroups(networkGroups, timeSort);

    for (const message of formattedOutput) {
      if (message.trim() !== '') {
        await this.sendMessage(message);
      }
    }

    this.displayFooter();
  }

  /**
   * Send a message to the configured Slack channel
   * @param message Message to send
   * @returns Promise resolving when message has been sent
   */
  private async sendMessage(message: string): Promise<void> {
    if (this.client === null || this.channel === null) {
      console.error('Slack client not initialized');
      return;
    }

    try {
      await this.client.chat.postMessage({
        channel: this.channel,
        text: message,
        mrkdwn: true
      });
    } catch (error) {
      console.error('Failed to send message to Slack:', error);
    }
  }

  /**
   * Parse command line arguments for Slack output
   * @param args Command line arguments
   * @returns Parsed arguments
   */
  public parseArgs(args?: string[]): CliArgs {
    const defaultArgs: CliArgs = {
      date: '',
      country: 'US',
      types: [],
      networks: [],
      genres: [],
      languages: [],
      timeSort: false,
      query: '',
      slack: true,
      help: false,
      version: false,
      debug: false,
      limit: 0,
      $0: '',
      _: []
    } as CliArgs & Arguments;

    if (args === undefined || args.length === 0) {
      return defaultArgs;
    }

    const parsedArgs: CliArgs = { ...defaultArgs };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const nextArg = args[i + 1];

      switch (arg) {
      case '--date':
      case '-d':
        if (nextArg !== undefined && !nextArg.startsWith('-')) {
          parsedArgs.date = nextArg;
          i++;
        }
        break;
      case '--country':
      case '-c':
        if (nextArg !== undefined && !nextArg.startsWith('-')) {
          parsedArgs.country = nextArg;
          i++;
        }
        break;
      case '--types':
      case '-t':
        if (nextArg !== undefined && !nextArg.startsWith('-')) {
          parsedArgs.types = nextArg.split(',');
          i++;
        }
        break;
      case '--networks':
      case '-n':
        if (nextArg !== undefined && !nextArg.startsWith('-')) {
          parsedArgs.networks = nextArg.split(',');
          i++;
        }
        break;
      case '--genres':
      case '-g':
        if (nextArg !== undefined && !nextArg.startsWith('-')) {
          parsedArgs.genres = nextArg.split(',');
          i++;
        }
        break;
      case '--languages':
        if (nextArg !== undefined && !nextArg.startsWith('-')) {
          parsedArgs.languages = nextArg.split(',');
          i++;
        }
        break;
      case '--time-sort':
      case '-s':
        parsedArgs.timeSort = true;
        break;
      case '--query':
      case '-q':
        if (nextArg !== undefined && !nextArg.startsWith('-')) {
          parsedArgs.query = nextArg;
          i++;
        }
        break;
      case '--help':
      case '-h':
        parsedArgs.help = true;
        break;
      case '--version':
      case '-v':
        parsedArgs.version = true;
        break;
      case '--debug':
        parsedArgs.debug = true;
        break;
      case '--limit':
      case '-l':
        if (nextArg !== undefined && !nextArg.startsWith('-')) {
          parsedArgs.limit = parseInt(nextArg, 10);
          i++;
        }
        break;
      default:
        break;
      }
    }

    return parsedArgs;
  }
}
