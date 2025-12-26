/**
 * Implementation of ConfigService for Lambda environment
 * Does not use yargs - reads configuration from APP_CONFIG environment variable
 */
import { injectable } from 'tsyringe';

import type { ShowOptions } from '../../types/tvShowOptions.js';
import type { AppConfig } from '../../types/configTypes.js';
import { getTodayDate } from '../../utils/dateUtils.js';
import { getDefaultConfig } from '../../utils/configUtils.js';
import { BaseConfigServiceImpl } from '../baseConfigServiceImpl.js';

@injectable()
export class LambdaConfigServiceImpl extends BaseConfigServiceImpl {
  /**
   * Create a new LambdaConfigServiceImpl
   */
  constructor() {
    super();
    this.initialize();
  }

  /**
   * Initialize the service from environment variables
   * @private
   */
  private initialize(): void {
    // Load configuration from APP_CONFIG env var (inlined by CDK at deploy time)
    this.appConfig = this.loadAppConfig();

    // Get date from environment variable or use today
    this.dateString = this.getOptionalEnv('DATE', getTodayDate());

    // Initialize CLI options from environment or defaults
    this.cliOptions = {
      debug: this.getOptionalEnv('DEBUG', 'false') === 'true',
      groupByNetwork: true
    };

    // Set show options from config
    this.showOptions = this.buildShowOptions();
  }

  /**
   * Load app configuration from APP_CONFIG environment variable
   * Falls back to default config if not set
   * @private
   */
  private loadAppConfig(): AppConfig {
    const defaultConfig = getDefaultConfig();
    const appConfigEnv = process.env.APP_CONFIG;

    if (appConfigEnv === undefined || appConfigEnv === null || appConfigEnv.trim() === '') {
      // No APP_CONFIG set, use defaults
      return defaultConfig;
    }

    try {
      const parsed = JSON.parse(appConfigEnv) as Partial<AppConfig>;
      return {
        ...defaultConfig,
        ...parsed,
        slack: {
          ...defaultConfig.slack,
          ...(parsed.slack ?? {})
        }
      };
    } catch {
      // Invalid JSON, use defaults
      console.error('Failed to parse APP_CONFIG environment variable, using defaults');
      return defaultConfig;
    }
  }

  /**
   * Build show options from the loaded config
   * @private
   */
  private buildShowOptions(): ShowOptions {
    const defaultConfig = getDefaultConfig();

    return {
      date: this.dateString,
      country: this.appConfig.country ?? defaultConfig.country ?? 'US',
      types: this.appConfig.types ?? defaultConfig.types ?? [],
      networks: this.appConfig.networks ?? defaultConfig.networks ?? [],
      genres: this.appConfig.genres ?? defaultConfig.genres ?? [],
      languages: this.appConfig.languages ?? defaultConfig.languages ?? [],
      // Lambda always fetches all sources (AppConfig doesn't have fetchSource field)
      fetchSource: 'all'
    };
  }
}
