import { TestConfigServiceImpl } from '../../../implementations/test/testConfigServiceImpl.js';
import type { ConfigService } from '../../../interfaces/configService.js';
import type { ShowOptions } from '../../../types/tvShowOptions.js';
import type { CliOptions, AppConfig, SlackConfig } from '../../../types/configTypes.js';
import { MockOptions } from './types.js';

/**
 * Options for creating a mock config service
 */
export interface ConfigServiceOptions extends MockOptions<ConfigService> {
  /** Show options configuration */
  showOptions?: Partial<ShowOptions>;
  
  /** CLI options configuration */
  cliOptions?: Partial<CliOptions>;
  
  /** App configuration */
  appConfig?: Partial<AppConfig>;
  
  /** Slack configuration (will be merged with appConfig.slack) */
  slackConfig?: Partial<SlackConfig>;
}

/**
 * Creates a mock config service for testing
 * @param options Options for configuring the mock
 * @returns A mock config service instance
 */
export function createMockConfigService(options: ConfigServiceOptions = {}): TestConfigServiceImpl {
  // Merge slack config with app config if provided
  let appConfig = options.appConfig || {};
  if (options.slackConfig) {
    appConfig = {
      ...appConfig,
      slack: {
        enabled: false, // Default value to ensure it's always defined
        ...(appConfig.slack || {}),
        ...options.slackConfig
      }
    };
  }
  
  // Create the config service with the provided options
  const configService = new TestConfigServiceImpl(
    options.showOptions || {},
    options.cliOptions || {},
    appConfig
  );
  
  // Apply any custom implementations
  if (options.implementation) {
    Object.entries(options.implementation).forEach(([key, value]) => {
      // We need to cast here because we're dynamically setting properties
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (configService as any)[key] = value;
    });
  }
  
  return configService;
}
