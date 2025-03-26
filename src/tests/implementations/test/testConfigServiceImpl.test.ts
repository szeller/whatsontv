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
      fetchSource: 'web' as 'web' | 'network' | 'all'
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
      help: false
    };
    
    // Act
    const configService = new TestConfigServiceImpl({}, cliOptions);
    
    // Assert
    expect(configService.getCliOptions()).toEqual(cliOptions);
  });

  it('should use provided app config', () => {
    // Arrange
    const appConfig = {
      slack: {
        enabled: true,
        botToken: 'test-token',
        channel: 'test-channel'
      }
    };
    
    // Act
    const configService = new TestConfigServiceImpl({}, {}, appConfig);
    
    // Assert
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
      debug: true
    });
    
    // Assert
    expect(configService.getCliOptions().debug).toBe(true);
  });

  it('should allow updating app config', () => {
    // Arrange
    const configService = new TestConfigServiceImpl();
    
    // Act
    configService.setAppConfig({
      slack: {
        enabled: false,
        channel: 'updated-channel'
      }
    });
    
    // Assert
    expect(configService.getConfig().slack.channel).toBe('updated-channel');
    expect(configService.getConfig().slack.enabled).toBe(false); // Unchanged default
  });
});
