/**
 * Implementation of ConfigService for testing purposes
 * Allows complete control over configuration values
 */
import type { ConfigService } from '../../interfaces/configService.js';
import type { ShowOptions } from '../../types/tvShowOptions.js';
import type { CliOptions, AppConfig } from '../../types/configTypes.js';

export class TestConfigServiceImpl implements ConfigService {
  private showOptions: ShowOptions;
  private cliOptions: CliOptions;
  private appConfig: AppConfig;

  /**
   * Create a new TestConfigServiceImpl
   * @param showOptions Show options configuration
   * @param cliOptions CLI-specific options
   * @param appConfig Application configuration
   */
  constructor(
    showOptions: Partial<ShowOptions> = {}, 
    cliOptions: Partial<CliOptions> = {},
    appConfig: Partial<AppConfig> = {}
  ) {
    // Initialize show options with defaults
    this.showOptions = {
      date: showOptions.date ?? '2025-03-25',
      country: showOptions.country ?? 'US',
      types: showOptions.types ?? [],
      networks: showOptions.networks ?? [],
      genres: showOptions.genres ?? [],
      languages: showOptions.languages ?? ['English'],
      fetchSource: showOptions.fetchSource ?? 'all'
    };
    
    // Initialize CLI options with defaults
    this.cliOptions = {
      debug: cliOptions.debug ?? false,
      help: cliOptions.help ?? false,
      groupByNetwork: cliOptions.groupByNetwork ?? false
    };
    
    // Initialize app config with defaults
    this.appConfig = {
      country: appConfig.country ?? 'US',
      types: appConfig.types ?? [],
      networks: appConfig.networks ?? [],
      genres: appConfig.genres ?? [],
      languages: appConfig.languages ?? ['English'],
      notificationTime: appConfig.notificationTime ?? '09:00',
      slack: appConfig.slack ?? {
        enabled: false
      }
    };
  }
  
  /**
   * Get the complete show options configuration
   * @returns Configuration options for fetching and displaying shows
   */
  getShowOptions(): ShowOptions {
    return { ...this.showOptions };
  }
  
  /**
   * Get a specific show option value
   * @param key Show option key
   * @returns Value for the specified key
   */
  getShowOption<K extends keyof ShowOptions>(key: K): ShowOptions[K] {
    return this.showOptions[key];
  }
  
  /**
   * Get CLI options
   */
  getCliOptions(): CliOptions {
    return this.cliOptions;
  }

  /**
   * Get help text for the CLI
   */
  getHelpText(): string {
    return 'Test help text';
  }
  
  /**
   * Get the complete application configuration
   * @returns The full application configuration
   */
  getConfig(): AppConfig {
    return { ...this.appConfig };
  }
  
  /**
   * Update show options for testing
   * @param options New show options
   */
  setShowOptions(options: Partial<ShowOptions>): void {
    this.showOptions = {
      ...this.showOptions,
      ...options
    };
  }
  
  /**
   * Update CLI options for testing
   * @param options New CLI options
   */
  setCliOptions(options: Partial<CliOptions>): void {
    this.cliOptions = {
      ...this.cliOptions,
      ...options
    };
  }
  
  /**
   * Update app config for testing
   * @param config New app config
   */
  setAppConfig(config: Partial<AppConfig>): void {
    this.appConfig = {
      ...this.appConfig,
      ...config,
      slack: {
        ...this.appConfig.slack,
        ...(config.slack || {})
      }
    };
  }
}
