/**
 * Tests for TestConfigServiceImpl
 */
import { describe, it, expect } from '@jest/globals';

import { TestConfigServiceImpl } from '../../../implementations/test/testConfigServiceImpl.js';

describe('TestConfigServiceImpl', () => {
  it('should use default values when no options provided', () => {
    // Arrange & Act
    const configService = new TestConfigServiceImpl();
    
    // Assert
    expect(configService.getAppName()).toBe('WhatsOnTV-Test');
    expect(configService.getVersion()).toBe('1.0.0-test');
    expect(configService.getShowOptions().country).toBe('US');
    expect(configService.getShowOptions().date).toBe('2025-03-25');
  });

  it('should use provided show options', () => {
    // Arrange
    const showOptions = {
      date: '2025-04-01',
      country: 'UK',
      types: ['Scripted'],
      networks: ['BBC'],
      genres: ['Drama'],
      languages: ['English'],
      webOnly: true,
      showAll: false
    };
    
    // Act
    const configService = new TestConfigServiceImpl(showOptions);
    
    // Assert
    expect(configService.getShowOptions()).toEqual(showOptions);
    expect(configService.getShowOption('date')).toBe('2025-04-01');
    expect(configService.getShowOption('country')).toBe('UK');
    expect(configService.getShowOption('types')).toEqual(['Scripted']);
  });

  it('should use provided CLI options', () => {
    // Arrange
    const cliOptions = {
      debug: true,
      timeSort: true,
      slack: true,
      help: false,
      version: false,
      limit: 10
    };
    
    // Act
    const configService = new TestConfigServiceImpl({}, cliOptions);
    
    // Assert
    expect(configService.getCliOptions()).toEqual(cliOptions);
  });

  it('should use provided app config', () => {
    // Arrange
    const appConfig = {
      appName: 'CustomTestApp',
      version: '2.0.0-test',
      apiUrl: 'https://test-api.example.com',
      slack: {
        enabled: true,
        botToken: 'test-token',
        channel: 'test-channel'
      }
    };
    
    // Act
    const configService = new TestConfigServiceImpl({}, {}, appConfig);
    
    // Assert
    expect(configService.getAppName()).toBe('CustomTestApp');
    expect(configService.getVersion()).toBe('2.0.0-test');
    expect(configService.getApiUrl()).toBe('https://test-api.example.com');
    expect(configService.getConfig().slack.botToken).toBe('test-token');
  });

  it('should allow updating show options', () => {
    // Arrange
    const configService = new TestConfigServiceImpl();
    
    // Act
    configService.setShowOptions({
      country: 'CA',
      types: ['Reality']
    });
    
    // Assert
    expect(configService.getShowOption('country')).toBe('CA');
    expect(configService.getShowOption('types')).toEqual(['Reality']);
    expect(configService.getShowOption('date')).toBe('2025-03-25'); // Unchanged
  });

  it('should allow updating CLI options', () => {
    // Arrange
    const configService = new TestConfigServiceImpl();
    
    // Act
    configService.setCliOptions({
      debug: true,
      limit: 20
    });
    
    // Assert
    expect(configService.getCliOptions().debug).toBe(true);
    expect(configService.getCliOptions().limit).toBe(20);
    expect(configService.getCliOptions().slack).toBe(false); // Unchanged
  });

  it('should allow updating app config', () => {
    // Arrange
    const configService = new TestConfigServiceImpl();
    
    // Act
    configService.setAppConfig({
      appName: 'UpdatedApp',
      slack: {
        enabled: false,
        channel: 'updated-channel'
      }
    });
    
    // Assert
    expect(configService.getAppName()).toBe('UpdatedApp');
    expect(configService.getConfig().slack.channel).toBe('updated-channel');
    expect(configService.getConfig().slack.enabled).toBe(false); // Unchanged default
  });
});
