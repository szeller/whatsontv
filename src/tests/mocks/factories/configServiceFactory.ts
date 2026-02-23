import { TestConfigServiceImpl } from '../../../implementations/test/testConfigServiceImpl.js';
import type { ConfigService } from '../../../interfaces/configService.js';
import type { ShowOptions } from '../../../types/tvShowOptions.js';
import type { CliOptions, AppConfig, SlackConfig } from '../../../types/configTypes.js';
import { MockOptions } from './types.js';
import { createTypedMock } from '../../testutils/jestHelpers.js';

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
  
  /** Whether to enhance with Jest mocks (default: true) */
  enhanceWithJestMocks?: boolean;
}

/**
 * Creates a mock config service for testing
 * @param options Options for configuring the mock
 * @returns A mock config service instance
 */
export function createMockConfigService(options: ConfigServiceOptions = {}): TestConfigServiceImpl {
  // Default slack config with required properties
  const defaultSlackConfig: SlackConfig = {
    token: 'test-token',
    channelId: 'test-channel',
    username: 'WhatsOnTV'
  };
  
  // Merge slack config with app config if provided
  let appConfig = options.appConfig ?? {};
  
  // Make sure appConfig.slack has the default values
  appConfig = {
    ...appConfig,
    slack: {
      ...defaultSlackConfig,
      ...appConfig.slack
    } as SlackConfig
  };
  
  // Apply slackConfig if provided
  if (options.slackConfig) {
    appConfig = {
      ...appConfig,
      slack: {
        ...appConfig.slack,
        ...options.slackConfig
      } as SlackConfig
    };
  }
  
  // Create the config service with the provided options
  const configService = new TestConfigServiceImpl(
    options.showOptions ?? {},
    options.cliOptions ?? {},
    appConfig,
    // Ensure slackOptions has all required properties
    {
      ...defaultSlackConfig,
      ...options.slackConfig
    } as SlackConfig
  );
  
  // By default, enhance with Jest mocks unless explicitly disabled
  const shouldEnhanceWithJestMocks = options.enhanceWithJestMocks !== false;
  
  if (shouldEnhanceWithJestMocks) {
    // Get the original values before mocking
    const originalShowOptions = configService.getShowOptions();
    const originalCliOptions = configService.getCliOptions();
    const originalConfig = configService.getConfig();
    const originalSlackOptions = configService.getSlackOptions();
    
    // Enhance methods with typed mocks for better type safety
    configService.getShowOptions = createTypedMock<TestConfigServiceImpl['getShowOptions']>();
    (configService.getShowOptions as jest.Mock).mockImplementation(() => originalShowOptions);
    
    configService.getCliOptions = createTypedMock<TestConfigServiceImpl['getCliOptions']>();
    (configService.getCliOptions as jest.Mock).mockImplementation(() => originalCliOptions);
    
    configService.getConfig = createTypedMock<TestConfigServiceImpl['getConfig']>();
    (configService.getConfig as jest.Mock).mockImplementation(() => originalConfig);
    
    configService.getSlackOptions = createTypedMock<TestConfigServiceImpl['getSlackOptions']>();
    (configService.getSlackOptions as jest.Mock).mockImplementation(() => originalSlackOptions);
    
    // Apply any custom implementations
    if (options.implementation) {
      for (const [key, value] of Object.entries(options.implementation)) {
        // We need to cast here because we're dynamically setting properties
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (configService as any)[key] = value;
      }
    }
  }
  
  return configService;
}
