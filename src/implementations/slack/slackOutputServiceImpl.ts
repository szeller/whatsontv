import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';

import type { OutputService } from '../../interfaces/outputService.js';
import type { ShowFormatter } from '../../interfaces/showFormatter.js';
import type { TvShowService } from '../../interfaces/tvShowService.js';
import type { CliArgs } from '../../types/cliArgs.js';
import type { Show } from '../../types/tvShowModel.js';

/**
 * Implementation of the OutputService for Slack
 * Handles sending TV show information to Slack channels
 * 
 * TODO: This is a stub implementation that will be properly implemented in the future
 */
@injectable()
export class SlackOutputServiceImpl implements OutputService {
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
   * Check if the service is properly initialized
   * @returns True if initialized, false otherwise
   * TODO: Implement actual Slack integration
   */
  public isInitialized(): boolean {
    // Stub implementation always returns false since it's not actually initialized
    return false;
  }

  /**
   * Display application header
   * TODO: Implement actual Slack integration
   */
  public displayHeader(): void {
    console.warn('[SLACK STUB] Would display header');
  }

  /**
   * Display application footer
   * TODO: Implement actual Slack integration
   */
  public displayFooter(): void {
    console.warn('[SLACK STUB] Would display footer');
  }

  /**
   * Display TV shows in Slack
   * @param shows Shows to display
   * @param _timeSort Whether to sort shows by time (unused in stub)
   * @returns Promise resolving when shows have been sent
   * TODO: Implement actual Slack integration
   */
  public async displayShows(shows: Show[], _timeSort = false): Promise<void> {
    console.warn(`[SLACK STUB] Would display ${shows.length} shows`);
    // Add an await to satisfy the linter
    await Promise.resolve();
  }

  /**
   * Parse command line arguments
   * @param _args Raw command line arguments (unused in stub)
   * @returns Parsed arguments
   * TODO: Implement actual Slack integration
   */
  public parseArgs(_args?: string[]): CliArgs {
    console.warn('[SLACK STUB] Would parse arguments');
    return {
      date: new Date().toISOString().split('T')[0],
      country: 'US',
      debug: false,
      types: [],
      networks: [],
      genres: [],
      languages: [],
      timeSort: false,
      query: '',
      slack: true,
      help: false,
      version: false,
      limit: 0
    };
  }
}
