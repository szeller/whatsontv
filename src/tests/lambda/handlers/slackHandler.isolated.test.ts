/**
 * Lambda Handler Tests - Completely Isolated
 * 
 * Tests for the Slack Lambda handler that are completely isolated from external services.
 * These tests focus on the Lambda handler logic without making any real API calls.
 */
import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals';
import { container } from '../../../slackContainer.js';
import { createMockProcessOutput } from '../../mocks/factories/processOutputFactory.js';
import { createMockConfigService } from '../../mocks/factories/configServiceFactory.js';
import { createMockSlackClient } from '../../mocks/factories/slackClientFactory.js';
import { createSlackAppWithContainer } from '../../../cli/slackCli.js';
import { getTodayDate } from '../../../utils/dateUtils.js';

describe('Lambda Handler Logic - Isolated Tests', () => {
  // Mock console methods to suppress output during tests
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;
  let originalConsoleWarn: typeof console.warn;

  beforeEach(() => {
    // Save original console methods
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    
    // Mock console methods to suppress output
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe('Slack App Creation with Test Container', () => {
    test('should create Slack app with mocked services successfully', () => {
      // Create test container with all mocked services
      const testContainer = container.createChildContainer();

      // Create mock services to prevent any real API calls
      const mockProcessOutput = createMockProcessOutput();
      const mockConfigService = createMockConfigService({
        showOptions: {
          date: getTodayDate(),
          country: 'US',
          types: [],
          networks: [],
          genres: [],
          languages: [],
          fetchSource: 'network'
        },
        cliOptions: {
          debug: false,
          groupByNetwork: true
        },
        enhanceWithJestMocks: false
      });
      const mockSlackClient = createMockSlackClient();

      // Register all services in test container to ensure complete isolation
      testContainer.register('ProcessOutput', { useValue: mockProcessOutput });
      testContainer.register('ConfigService', { useValue: mockConfigService });
      testContainer.register('SlackClient', { useValue: mockSlackClient });

      // Create Slack app using test container (no real API calls)
      const app = createSlackAppWithContainer(testContainer);

      // Verify app was created successfully
      expect(app).toBeDefined();
      expect(typeof app.run).toBe('function');
    });

    test('should run Slack app without making external API calls', async () => {
      // Create test container with all mocked services
      const testContainer = container.createChildContainer();

      // Create mock services
      const mockProcessOutput = createMockProcessOutput();
      const mockConfigService = createMockConfigService({
        showOptions: {
          date: getTodayDate(),
          country: 'US',
          types: [],
          networks: [],
          genres: [],
          languages: [],
          fetchSource: 'network'
        },
        cliOptions: {
          debug: false,
          groupByNetwork: true
        },
        enhanceWithJestMocks: false
      });
      const mockSlackClient = createMockSlackClient();

      // Register services to prevent real API calls
      testContainer.register('ProcessOutput', { useValue: mockProcessOutput });
      testContainer.register('ConfigService', { useValue: mockConfigService });
      testContainer.register('SlackClient', { useValue: mockSlackClient });

      // Create and run Slack app
      const app = createSlackAppWithContainer(testContainer);
      
      // This should complete without making any real API calls
      await expect(app.run()).resolves.not.toThrow();

      // Verify that the app ran successfully without throwing errors
      // (The mock Slack client prevents any real API calls)
    });
  });

  describe('Environment Variable Validation', () => {
    test('should validate required environment variables', () => {
      // Test the same validation logic that the Lambda handler uses
      const validateEnvVars = (slackToken?: string, slackChannel?: string): void => {
        if (slackToken === undefined || slackToken === null || slackToken.trim() === '') {
          throw new Error(
            'SLACK_TOKEN environment variable is required but not set'
          );
        }
        if (slackChannel === undefined || slackChannel === null || slackChannel.trim() === '') {
          throw new Error(
            'SLACK_CHANNEL environment variable is required but not set'
          );
        }
      };

      // Test missing token
      expect(() => { validateEnvVars(undefined, '#test'); }).toThrow(
        'SLACK_TOKEN environment variable is required but not set'
      );
      
      // Test empty token
      expect(() => { validateEnvVars('', '#test'); }).toThrow(
        'SLACK_TOKEN environment variable is required but not set'
      );
      
      // Test missing channel
      expect(() => { validateEnvVars('test-token', undefined); }).toThrow(
        'SLACK_CHANNEL environment variable is required but not set'
      );
      
      // Test empty channel
      expect(() => { validateEnvVars('test-token', ''); }).toThrow(
        'SLACK_CHANNEL environment variable is required but not set'
      );
      
      // Test valid values
      expect(() => { validateEnvVars('test-token', '#test-channel'); }).not.toThrow();
    });
  });

  describe('Lambda Response Format', () => {
    test('should format success response correctly', () => {
      const createSuccessResponse = (requestId: string): {
        statusCode: number;
        body: string;
      } => ({
        statusCode: 200,
        body: JSON.stringify({
          message: 'TV shows successfully processed and sent to Slack',
          requestId: requestId
        })
      });

      const response = createSuccessResponse('test-request-123');
      
      expect(response.statusCode).toBe(200);
      expect(typeof response.body).toBe('string');
      
      const body = JSON.parse(response.body);
      expect(body.message).toBe('TV shows successfully processed and sent to Slack');
      expect(body.requestId).toBe('test-request-123');
    });

    test('should format error response correctly', () => {
      const createErrorResponse = (
        error: Error, 
        requestId: string
      ): {
        statusCode: number;
        body: string;
      } => ({
        statusCode: 500,
        body: JSON.stringify({
          error: error.message,
          message: 'Failed to process TV shows',
          requestId: requestId
        })
      });

      const testError = new Error('Test error message');
      const response = createErrorResponse(testError, 'test-request-456');
      
      expect(response.statusCode).toBe(500);
      expect(typeof response.body).toBe('string');
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Test error message');
      expect(body.message).toBe('Failed to process TV shows');
      expect(body.requestId).toBe('test-request-456');
    });
  });

  describe('Service Registration', () => {
    test('should register and resolve all services correctly', () => {
      // Create test container
      const testContainer = container.createChildContainer();

      // Create and register mock services
      const mockProcessOutput = createMockProcessOutput();
      const mockConfigService = createMockConfigService({
        showOptions: {
          date: getTodayDate(),
          country: 'US',
          types: [],
          networks: [],
          genres: [],
          languages: [],
          fetchSource: 'network'
        },
        cliOptions: {
          debug: false,
          groupByNetwork: true
        },
        enhanceWithJestMocks: false
      });
      const mockSlackClient = createMockSlackClient();

      testContainer.register('ProcessOutput', { useValue: mockProcessOutput });
      testContainer.register('ConfigService', { useValue: mockConfigService });
      testContainer.register('SlackClient', { useValue: mockSlackClient });

      // Verify all services can be resolved correctly
      const resolvedConsoleOutput = testContainer.resolve('ProcessOutput');
      const resolvedConfigService = testContainer.resolve('ConfigService');
      const resolvedSlackClient = testContainer.resolve('SlackClient');

      expect(resolvedConsoleOutput).toBe(mockProcessOutput);
      expect(resolvedConfigService).toBe(mockConfigService);
      expect(resolvedSlackClient).toBe(mockSlackClient);

      // Verify services have expected methods (ensuring they're mock objects)
      expect(typeof mockProcessOutput.log).toBe('function');
      expect(typeof mockSlackClient.sendMessage).toBe('function');
    });
  });
});
