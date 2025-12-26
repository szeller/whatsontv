/**
 * Implementation of ConfigService for Lambda environment
 * Does not use yargs - reads configuration from config file and environment variables
 */
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { injectable } from 'tsyringe';

import type { ShowOptions } from '../../types/tvShowOptions.js';
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
   * Initialize the service from config file and environment variables
   * @private
   */
  private initialize(): void {
    // Load configuration from file
    const configPath = this.getConfigPath();
    this.appConfig = this.loadConfig(configPath);

    // Get date from environment variable or use today
    this.dateString = this.getOptionalEnv('DATE', getTodayDate());

    // Initialize CLI options from environment or defaults
    this.cliOptions = {
      debug: this.getOptionalEnv('DEBUG', 'false') === 'true',
      groupByNetwork: true
    };

    // Set show options from config file
    this.showOptions = this.buildShowOptions();
  }

  /**
   * Get the path to the config file
   * Uses CONFIG_FILE env var or defaults to config.lambda.json in the Lambda root
   * @private
   */
  private getConfigPath(): string {
    const configFileEnv = process.env.CONFIG_FILE;
    if (configFileEnv !== undefined && configFileEnv !== null && configFileEnv.trim() !== '') {
      return configFileEnv;
    }

    // Default to config.lambda.json in the same directory as the handler
    const currentDir = dirname(fileURLToPath(import.meta.url));
    return resolve(currentDir, '../../config.lambda.json');
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
