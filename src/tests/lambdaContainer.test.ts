/**
 * Tests for Lambda container initialization
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { container } from 'tsyringe';

describe('lambdaContainer', () => {
  let originalAppConfig: string | undefined;

  beforeEach(() => {
    // Save and set APP_CONFIG for Lambda config service
    originalAppConfig = process.env.APP_CONFIG;
    process.env.APP_CONFIG = JSON.stringify({ country: 'US' });

    // Clear the container before each test
    container.clearInstances();
  });

  afterEach(() => {
    // Restore original env var
    if (originalAppConfig === undefined) {
      delete process.env.APP_CONFIG;
    } else {
      process.env.APP_CONFIG = originalAppConfig;
    }

    // Clear container after test
    container.clearInstances();
  });

  it('initializes all Lambda dependencies without error', async () => {
    // Dynamic import to avoid side effects at module load time
    const { initializeLambdaContainer } = await import('../lambdaContainer.js');

    expect(() => { initializeLambdaContainer(); }).not.toThrow();
  });

  it('registers TvShowService', async () => {
    const { initializeLambdaContainer, container: lambdaContainer } =
      await import('../lambdaContainer.js');

    initializeLambdaContainer();

    const tvShowService = lambdaContainer.resolve('TvShowService');
    expect(tvShowService).toBeDefined();
  });

  it('registers ConfigService as LambdaConfigServiceImpl', async () => {
    const { initializeLambdaContainer, container: lambdaContainer } =
      await import('../lambdaContainer.js');

    initializeLambdaContainer();

    const configService = lambdaContainer.resolve('ConfigService');
    expect(configService).toBeDefined();
    expect(configService.getShowOptions()).toHaveProperty('country');
  });

  it('registers SlackClient', async () => {
    const { initializeLambdaContainer, container: lambdaContainer } =
      await import('../lambdaContainer.js');

    initializeLambdaContainer();

    const slackClient = lambdaContainer.resolve('SlackClient');
    expect(slackClient).toBeDefined();
  });

  it('registers platform type as lambda', async () => {
    const { initializeLambdaContainer, container: lambdaContainer } =
      await import('../lambdaContainer.js');

    initializeLambdaContainer();

    const platformType = lambdaContainer.resolve('PlatformType');
    expect(platformType).toBe('lambda');
  });
});
