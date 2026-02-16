/**
 * Implementation of ConfigService that combines CLI arguments and config file
 * Uses yargs for command-line argument parsing
 */
import { injectable } from 'tsyringe';
import yargs from 'yargs';

import type { CliArgs } from '../../types/cliArgs.js';
import { getTodayDate } from '../../utils/dateUtils.js';
import { getStringValue } from '../../utils/stringUtils.js';
import {
  toStringArray,
  mergeShowOptions
} from '../../utils/configUtils.js';
import { BaseConfigServiceImpl } from '../baseConfigServiceImpl.js';

@injectable()
export class CliConfigServiceImpl extends BaseConfigServiceImpl {
  protected cliArgs!: CliArgs;

  /**
   * Create a new CliConfigServiceImpl
   * @param skipInitialization Optional flag to skip initialization (for testing)
   */
  constructor(skipInitialization = false) {
    super();
    if (!skipInitialization) {
      this.initialize();
    }
  }

  /**
   * Initialize the service by parsing CLI arguments and loading config
   * @private
   */
  private initialize(): void {
    // Parse command line arguments
    this.cliArgs = this.parseArgs();

    // Store date string for base class getDate() method
    this.dateString = this.cliArgs.date;

    // Load configuration
    this.appConfig = this.loadConfig();

    // Initialize CLI options from parsed arguments
    this.cliOptions = {
      debug: this.cliArgs.debug,
      groupByNetwork: this.cliArgs.groupByNetwork
    };

    // Set initial show options from config
    this.showOptions = mergeShowOptions(this.cliArgs, this.appConfig);
  }

  /**
   * Parse command line arguments
   * @param args Optional array of command line arguments
   * @returns Parsed CLI arguments
   * @protected
   */
  protected parseArgs(args?: string[]): CliArgs {
    // Create a yargs instance with our options
    const yargsInstance = this.createYargsInstance(
      args ?? process.argv.slice(2)
    );

    // Parse the arguments - use parseSync to ensure we get a synchronous result
    const parsedArgs = yargsInstance.parseSync();

    // Convert to our CliArgs type with proper type handling
    return {
      date: getStringValue(
        (parsedArgs.date as string | undefined) ?? '', getTodayDate()
      ),
      country: getStringValue(
        (parsedArgs.country as string | undefined) ?? '', 'US'
      ),
      types: toStringArray(parsedArgs.types as string | string[] | undefined),
      networks: toStringArray(parsedArgs.networks as string | string[] | undefined),
      genres: toStringArray(parsedArgs.genres as string | string[] | undefined),
      languages: toStringArray(parsedArgs.languages as string | string[] | undefined),
      minAirtime: getStringValue(
        (parsedArgs.minAirtime as string | undefined) ?? '', '18:00'
      ),
      debug: parsedArgs.debug as boolean,
      groupByNetwork: true // Default to true, not configurable via CLI yet
    };
  }

  /**
   * Create and configure a yargs instance
   * @param args Command line arguments
   * @returns Configured yargs instance
   * @protected
   */
  protected createYargsInstance(args: string[]): ReturnType<typeof yargs> {
    return yargs(args)
      .option({
        date: {
          alias: 'd',
          describe: 'Date to show TV listings for (format: YYYY-MM-DD)',
          type: 'string',
          default: getTodayDate()
        },
        country: {
          alias: 'c',
          describe: 'Country code (e.g., US, UK, CA)',
          type: 'string',
          default: 'US'
        },
        types: {
          alias: 't',
          describe: 'Show types to include (e.g., Scripted,Reality)',
          type: 'string',
          coerce: (arg: string) => toStringArray(arg)
        },
        networks: {
          alias: 'n',
          describe: 'Networks to include (e.g., HBO,Netflix)',
          type: 'string',
          coerce: (arg: string) => toStringArray(arg)
        },
        genres: {
          alias: 'g',
          describe: 'Genres to include (e.g., Drama,Comedy)',
          type: 'string',
          coerce: (arg: string) => toStringArray(arg)
        },
        languages: {
          alias: 'l',
          describe: 'Languages to include (e.g., English,Spanish)',
          type: 'string',
          coerce: (arg: string) => toStringArray(arg)
        },
        minAirtime: {
          describe: 'Minimum airtime to include (format: HH:MM, 24-hour format)',
          type: 'string',
          default: '18:00'
        },
        debug: {
          alias: 'D',
          describe: 'Enable debug mode',
          type: 'boolean',
          default: false
        }
      })
      .help()
      .alias('help', 'h');
  }
}
