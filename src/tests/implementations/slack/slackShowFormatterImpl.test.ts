/**
 * Tests for the Slack Show Formatter Implementation
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { container } from 'tsyringe';
import { SlackShowFormatterImpl } from '../../../implementations/slack/slackShowFormatterImpl';
import { ShowBuilder } from '../../fixtures/helpers/showFixtureBuilder';
import type { Show } from '../../../schemas/domain';
import {
  isSectionBlock,
  isHeaderBlock,
  isContextBlock,
  type SlackSectionBlock,
  type SlackHeaderBlock,
  type SlackContextBlock
} from '../../../interfaces/slackClient';

describe('SlackShowFormatterImpl', () => {
  let formatter: SlackShowFormatterImpl;
  let mockShow: Show;
  let mockShowNoAirtime: Show;

  beforeEach(() => {
    // Reset container for each test
    container.clearInstances();
    
    // Create the formatter instance directly since it doesn't have dependencies
    container.registerInstance('ConfigService', {
      getDate: jest.fn().mockReturnValue(new Date('2022-12-31'))
    });
    formatter = container.resolve(SlackShowFormatterImpl);
    
    // Create mock show data using ShowBuilder
    mockShow = ShowBuilder.createTestShow({
      name: 'Test Show',
      airtime: '20:00',
      season: 1,
      number: 1
    });
    
    // Create a mock show with no airtime
    mockShowNoAirtime = ShowBuilder.createTestShow({ 
      name: 'Test Show No Airtime',
      airtime: null 
    });
  });

  describe('formatTimedShow', () => {
    it('should format a show with airtime correctly', () => {
      // Act
      const result = formatter.formatTimedShow(mockShow);

      // Assert
      expect(result).toEqual({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: expect.stringContaining('Test Show')
        }
      });
      
      // Check if the airtime is included
      expect(result.type).toBe('section');
      const isSectionResult = isSectionBlock(result);
      if (isSectionResult === true) {
        const sectionBlock = result as SlackSectionBlock;
        expect(sectionBlock.text.type).toBe('mrkdwn');
        expect(sectionBlock.text.text).toContain('Test Show');
      }
    });
  });

  describe('formatUntimedShow', () => {
    it('should format a show without airtime correctly', () => {
      // Act
      const result = formatter.formatUntimedShow(mockShowNoAirtime);

      // Assert
      expect(result).toEqual({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: expect.stringContaining('Test Show No Airtime')
        }
      });

      // Check that the result is a section block with show name
      // In compact format, shows without airtime don't include "(N/A)"
      expect(result.type).toBe('section');
      const isSectionResult = isSectionBlock(result);
      if (isSectionResult === true) {
        const sectionBlock = result as SlackSectionBlock;
        expect(sectionBlock.text.type).toBe('mrkdwn');
        expect(sectionBlock.text.text).toContain('Test Show No Airtime');
      }
    });
  });

  describe('formatMultipleEpisodes', () => {
    it('should format multiple episodes of the same show', () => {
      // Arrange
      const show1 = ShowBuilder.createTestShow({
        name: 'Test Show',
        airtime: '20:00',
        season: 1,
        number: 1
      });
      
      const show2 = ShowBuilder.createTestShow({
        name: 'Test Show',
        airtime: '21:00',
        season: 1,
        number: 2
      });

      // Act
      const result = formatter.formatMultipleEpisodes([show1, show2]);

      // Assert
      expect(result).toHaveLength(1);
      
      const block = result[0];
      const isSection = isSectionBlock(block);
      expect(isSection).toBe(true);
      
      if (isSection === true) {
        const sectionBlock = block as SlackSectionBlock;
        expect(sectionBlock.text.type).toBe('mrkdwn');
        expect(sectionBlock.text.text).toContain('Test Show');
        // Updated to match the new implementation's format for sequential episodes
        expect(sectionBlock.text.text).toContain('S01E01-02');
      }
    });

    it('should consolidate sequential episodes from the same season', () => {
      // Arrange
      const episodes = [
        ShowBuilder.createTestShow({
          name: 'Test Show',
          airtime: '20:00',
          season: 1,
          number: 1
        }),
        ShowBuilder.createTestShow({
          name: 'Test Show',
          airtime: '21:00',
          season: 1,
          number: 2
        }),
        ShowBuilder.createTestShow({
          name: 'Test Show',
          airtime: '22:00',
          season: 1,
          number: 3
        })
      ];

      // Act
      const result = formatter.formatMultipleEpisodes(episodes);

      // Assert
      expect(result).toHaveLength(1);
      
      const block = result[0];
      const isSection = isSectionBlock(block);
      expect(isSection).toBe(true);
      
      if (isSection === true) {
        const sectionBlock = block as SlackSectionBlock;
        expect(sectionBlock.text.type).toBe('mrkdwn');
        expect(sectionBlock.text.text).toContain('Test Show');
        // Should show consolidated range format
        expect(sectionBlock.text.text).toContain('S01E01-03');
        // Should include airtime
        expect(sectionBlock.text.text).toContain('(8:00 PM)');
      }
    });

    it('should not consolidate non-sequential episodes', () => {
      // Arrange
      const episodes = [
        ShowBuilder.createTestShow({
          name: 'Test Show',
          airtime: '20:00',
          season: 1,
          number: 1
        }),
        ShowBuilder.createTestShow({
          name: 'Test Show',
          airtime: '21:00',
          season: 1,
          number: 3
        }),
        ShowBuilder.createTestShow({
          name: 'Test Show',
          airtime: '22:00',
          season: 1,
          number: 5
        })
      ];

      // Act
      const result = formatter.formatMultipleEpisodes(episodes);

      // Assert
      expect(result).toHaveLength(1);
      
      const block = result[0];
      const isSection = isSectionBlock(block);
      expect(isSection).toBe(true);
      
      if (isSection === true) {
        const sectionBlock = block as SlackSectionBlock;
        // Should show individual episodes, not a range
        expect(sectionBlock.text.text).toContain('S01E01');
        expect(sectionBlock.text.text).toContain('S01E03');
        expect(sectionBlock.text.text).toContain('S01E05');
      }
    });

    it('should handle empty shows array', () => {
      // Act
      const result = formatter.formatMultipleEpisodes([]);

      // Assert - updated to match the new implementation
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('section');
      
      const sectionBlock = result[0] as SlackSectionBlock;
      expect(sectionBlock.text.text).toBe('No episodes found');
    });
  });

  describe('formatNetwork', () => {
    it('should format an empty network as context block', () => {
      // Arrange
      const networkName = 'Test Network';
      const emptyShows: Show[] = [];

      // Act
      const result = formatter.formatNetwork(networkName, emptyShows);

      // Assert - compact format returns a single context block
      expect(result.length).toBe(1);

      // Block should be a context block with network name
      const contextBlock = result[0];
      expect(contextBlock.type).toBe('context');

      const isContextResult = isContextBlock(contextBlock);
      if (isContextResult === true) {
        const contextBlockTyped = contextBlock as SlackContextBlock;
        const textElement = contextBlockTyped.elements[0];
        if ('text' in textElement) {
          expect(textElement.text).toContain('Test Network');
          expect(textElement.text).toContain(':tv:');
        }
      }
    });

    it('should format a network with shows as single context block', () => {
      // Arrange
      const network = 'Test Network';
      const shows: Show[] = [
        ShowBuilder.createTestShow({
          name: 'Network Show 1',
          network: 'Test Network'
        }),
        ShowBuilder.createTestShow({
          name: 'Network Show 2',
          network: 'Test Network'
        })
      ];

      // Act
      const result = formatter.formatNetwork(network, shows);

      // Assert - compact format returns a single context block per network
      expect(result.length).toBe(1);

      // Block should be a context block
      const contextBlock = result[0];
      expect(contextBlock.type).toBe('context');

      const isContextResult = isContextBlock(contextBlock);
      if (isContextResult === true) {
        const contextBlockTyped = contextBlock as SlackContextBlock;
        const textElement = contextBlockTyped.elements[0];
        if ('text' in textElement) {
          expect(textElement.text).toContain('Test Network');
          expect(textElement.text).toContain('Network Show 1');
          expect(textElement.text).toContain('Network Show 2');
          expect(textElement.text).toContain('•'); // Bullet points
        }
      }
    });
  });

  describe('formatNetworkGroups', () => {
    it('should format network groups correctly', () => {
      // Arrange
      const networkGroups = {
        'Network A': [
          ShowBuilder.createTestShow({
            name: 'Show 1',
            network: 'Network A'
          }),
          ShowBuilder.createTestShow({
            name: 'Show 2',
            network: 'Network A'
          })
        ],
        'Network B': [
          ShowBuilder.createTestShow({
            name: 'Show 3',
            network: 'Network B'
          })
        ]
      };

      // Act
      const result = formatter.formatNetworkGroups(networkGroups);

      // Assert
      expect(result.length).toBeGreaterThan(0);

      // Check for header block
      const headerBlocks = result.filter(block => isHeaderBlock(block)) as SlackHeaderBlock[];
      expect(headerBlocks.length).toBeGreaterThan(0);
      expect(headerBlocks[0].text.text).toBe('Shows by Network');

      // Check that networks are in context blocks
      const contextBlocks = result.filter(block => isContextBlock(block)) as SlackContextBlock[];
      expect(contextBlocks.length).toBeGreaterThan(0);

      // Find context blocks with shows
      const allContextText = contextBlocks
        .map(block => {
          const textElement = block.elements[0];
          return 'text' in textElement ? textElement.text : '';
        })
        .join('\n');

      expect(allContextText).toContain('Show 1');
      expect(allContextText).toContain('Show 2');
      expect(allContextText).toContain('Show 3');
    });

    it('should handle empty network groups', () => {
      // Act
      const result = formatter.formatNetworkGroups({});

      // Assert
      expect(result.length).toBeGreaterThan(0);

      // Check that it includes a header
      const headerBlocks = result.filter(block => isHeaderBlock(block));
      expect(headerBlocks.length).toBeGreaterThan(0);
    });
  });

  describe('compact format', () => {
    // The compact format uses bullet points without type emojis

    it('should format shows with bullet points', () => {
      const show = ShowBuilder.createTestShow({
        name: 'Test Show',
        type: 'scripted',
        airtime: '20:00'
      });

      const result = formatter.formatTimedShow(show);
      expect(result.text.text).toContain('•');
      expect(result.text.text).toContain('Test Show');
    });

    it('should include airtime for timed shows', () => {
      const show = ShowBuilder.createTestShow({
        name: 'Timed Show',
        airtime: '20:00'
      });

      const result = formatter.formatTimedShow(show);
      expect(result.text.text).toContain('8:00 PM');
    });

    it('should not include airtime for untimed shows', () => {
      const show = ShowBuilder.createTestShow({
        name: 'Untimed Show',
        airtime: null
      });

      const result = formatter.formatUntimedShow(show);
      expect(result.text.text).not.toContain('N/A');
      expect(result.text.text).not.toContain('PM');
    });
  });

  describe('formatMultipleEpisodes edge cases', () => {
    it('should handle null or undefined shows array', () => {
      // Act with null
      const resultNull = formatter.formatMultipleEpisodes(null as unknown as Show[]);
      
      // Assert
      expect(resultNull).toHaveLength(1);
      expect(resultNull[0].type).toBe('section');
      const sectionBlockNull = resultNull[0] as SlackSectionBlock;
      expect(sectionBlockNull.text.text).toBe('No episodes found');
      
      // Act with undefined
      const resultUndefined = formatter.formatMultipleEpisodes(undefined as unknown as Show[]);
      
      // Assert
      expect(resultUndefined).toHaveLength(1);
      expect(resultUndefined[0].type).toBe('section');
      const sectionBlockUndefined = resultUndefined[0] as SlackSectionBlock;
      expect(sectionBlockUndefined.text.text).toBe('No episodes found');
    });
    
    it('should handle episodes from different seasons', () => {
      // Arrange
      const episodes = [
        ShowBuilder.createTestShow({
          name: 'Test Show',
          airtime: '20:00',
          season: 1,
          number: 1
        }),
        ShowBuilder.createTestShow({
          name: 'Test Show',
          airtime: '21:00',
          season: 2,
          number: 1
        })
      ];
      
      // Act
      const result = formatter.formatMultipleEpisodes(episodes);
      
      // Assert
      expect(result).toHaveLength(1);
      const sectionBlock = result[0] as SlackSectionBlock;
      
      // Should show individual episodes, not consolidated
      expect(sectionBlock.text.text).toContain('S01E01');
      expect(sectionBlock.text.text).toContain('S02E01');
    });
    
    it('should handle episodes with mixed airtime values', () => {
      // Arrange
      const episodes = [
        ShowBuilder.createTestShow({
          name: 'Test Show',
          airtime: '20:00',
          season: 1,
          number: 1
        }),
        ShowBuilder.createTestShow({
          name: 'Test Show',
          airtime: null,
          season: 1,
          number: 2
        })
      ];
      
      // Act
      const result = formatter.formatMultipleEpisodes(episodes);
      
      // Assert
      expect(result).toHaveLength(1);
      const sectionBlock = result[0] as SlackSectionBlock;
      
      // The implementation consolidates sequential episodes and uses the first episode's airtime
      // So we should only expect to see the airtime from the first episode
      expect(sectionBlock.text.text).toContain('8:00 PM');
      // Since the episodes are consolidated, we won't see N/A in the output
      expect(sectionBlock.text.text).toContain('S01E01-02');
    });
    
    it('should handle episodes with missing episode numbers', () => {
      // Arrange
      const episodes = [
        ShowBuilder.createTestShow({
          name: 'Test Show',
          airtime: '20:00',
          season: 1,
          number: undefined
        }),
        ShowBuilder.createTestShow({
          name: 'Test Show',
          airtime: '21:00',
          season: 1,
          number: 2
        })
      ];
      
      // Act
      const result = formatter.formatMultipleEpisodes(episodes);
      
      // Assert
      expect(result).toHaveLength(1);
      const sectionBlock = result[0] as SlackSectionBlock;
      
      // Should not consolidate when episode numbers are missing
      expect(sectionBlock.text.text).toContain('S01');
      expect(sectionBlock.text.text).toContain('S01E02');
    });
  });
});
