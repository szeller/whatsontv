/**
 * Tests for the ConfigServiceFactory
 */
import { describe, it, expect, jest } from '@jest/globals';
import { createMockConfigService } from './configServiceFactory.js';

describe('ConfigServiceFactory', () => {
  describe('createMockConfigService', () => {
    it('should create a mock config service with default settings', () => {
      // Act
      const configService = createMockConfigService();
      
      // Assert
      expect(configService).toBeDefined();
      expect(configService.getShowOptions()).toBeDefined();
      expect(configService.getCliOptions()).toBeDefined();
      expect(configService.getConfig()).toBeDefined();
      
      // Check default values
      expect(configService.getShowOption('country')).toBe('US');
      expect(configService.getShowOption('languages')).toEqual(['English']);
      expect(configService.getCliOptions().debug).toBe(false);
      
      // Check that slack config has required properties
      expect(configService.getConfig().slack.token).toBe('test-token');
      expect(configService.getConfig().slack.channelId).toBe('test-channel');
      expect(configService.getConfig().slack.username).toBe('WhatsOnTV');
    });
    
    it('should set custom show options', () => {
      // Arrange
      const customShowOptions = {
        date: '2025-04-01',
        country: 'CA',
        languages: ['French'],
        excludeShowNames: ['Test Show']
      };

      // Act
      const configService = createMockConfigService({
        showOptions: customShowOptions
      });

      // Assert
      expect(configService.getShowOption('date')).toBe('2025-04-01');
      expect(configService.getShowOption('country')).toBe('CA');
      expect(configService.getShowOption('languages')).toEqual(['French']);
      expect(configService.getShowOption('excludeShowNames')).toEqual(['Test Show']);

      // Other options should have default values
      expect(configService.getShowOption('types')).toEqual([]);
    });
    
    it('should set custom CLI options', () => {
      // Arrange
      const customCliOptions = {
        debug: true,
        groupByNetwork: true
      };
      
      // Act
      const configService = createMockConfigService({
        cliOptions: customCliOptions
      });
      
      // Assert
      expect(configService.getCliOptions().debug).toBe(true);
      expect(configService.getCliOptions().groupByNetwork).toBe(true);
    });
    
    it('should set custom app config', () => {
      // Arrange
      const customAppConfig = {
        country: 'UK',
        networks: ['BBC', 'ITV'],
        notificationTime: '18:00'
      };
      
      // Act
      const configService = createMockConfigService({
        appConfig: customAppConfig
      });
      
      // Assert
      expect(configService.getConfig().country).toBe('UK');
      expect(configService.getConfig().networks).toEqual(['BBC', 'ITV']);
      expect(configService.getConfig().notificationTime).toBe('18:00');
      
      // Other options should have default values
      expect(configService.getConfig().languages).toEqual(['English']);
    });
    
    it('should set custom slack config', () => {
      // Arrange
      const slackConfig = {
        token: 'xoxb-test-token',
        channelId: '#tv-shows',
        username: 'SlackBot'
      };
      
      // Act
      const configService = createMockConfigService({
        slackConfig
      });
      
      // Assert
      expect(configService.getConfig().slack.token).toBe('xoxb-test-token');
      expect(configService.getConfig().slack.channelId).toBe('#tv-shows');
      expect(configService.getConfig().slack.username).toBe('SlackBot');
    });
    
    it('should merge slack config with app config', () => {
      // Arrange
      const appConfig = {
        country: 'UK',
        slack: {
          token: 'default-token',
          channelId: 'default-channel',
          username: 'DefaultBot'
        }
      };
      
      const slackConfig = {
        token: 'xoxb-test-token',
        channelId: '#tv-shows'
      };
      
      // Act
      const configService = createMockConfigService({
        appConfig,
        slackConfig
      });
      
      // Assert
      expect(configService.getConfig().country).toBe('UK');
      expect(configService.getConfig().slack.token).toBe('xoxb-test-token');
      expect(configService.getConfig().slack.channelId).toBe('#tv-shows');
      expect(configService.getConfig().slack.username).toBe('DefaultBot');
    });
    
    it('should apply custom implementation methods', () => {
      // Arrange
      const mockGetShowOptions = jest.fn().mockReturnValue({
        date: '2025-05-01',
        country: 'JP'
      });
      
      // Act
      const configService = createMockConfigService({
        implementation: {
          getShowOptions: mockGetShowOptions
        }
      });
      
      // Assert
      expect(configService.getShowOptions()).toEqual({
        date: '2025-05-01',
        country: 'JP'
      });
      expect(mockGetShowOptions).toHaveBeenCalled();
    });
  });
});
