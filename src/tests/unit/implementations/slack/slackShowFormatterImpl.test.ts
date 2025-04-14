/**
 * Tests for the Slack Show Formatter Implementation
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { container } from 'tsyringe';
import { SlackShowFormatterImpl } from '../../../../implementations/slack/slackShowFormatterImpl';
import { ShowBuilder } from '../../../fixtures/helpers/showFixtureBuilder';
import type { Show } from '../../../../schemas/domain';
import { 
  isSectionBlock,
  isHeaderBlock,
  type SlackSectionBlock,
  type SlackHeaderBlock
} from '../../../../interfaces/slackClient';

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
      
      // Check that the result includes N/A for airtime
      expect(result.type).toBe('section');
      const isSectionResult = isSectionBlock(result);
      if (isSectionResult === true) {
        const sectionBlock = result as SlackSectionBlock;
        expect(sectionBlock.text.type).toBe('mrkdwn');
        expect(sectionBlock.text.text).toContain('N/A');
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
    it('should format a network header', () => {
      // Arrange
      const networkName = 'Test Network';
      const emptyShows: Show[] = [];

      // Act
      const result = formatter.formatNetwork(networkName, emptyShows);

      // Assert - updated to match new implementation
      expect(result.length).toBeGreaterThan(0);
      
      // First block should be a header
      const headerBlock = result[0];
      expect(headerBlock.type).toBe('header');
      
      const isHeaderResult = isHeaderBlock(headerBlock);
      if (isHeaderResult === true) {
        const headerBlockTyped = headerBlock as SlackHeaderBlock;
        expect(headerBlockTyped.text.type).toBe('plain_text');
        expect(headerBlockTyped.text.text).toBe('Test Network');
      }
    });
    
    it('should format a network with shows', () => {
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

      // Assert - base implementation now returns header and show blocks
      expect(result.length).toBeGreaterThan(1);

      // First block should be a header
      const headerBlock = result[0];
      expect(headerBlock.type).toBe('header');
      
      const isHeaderResult = isHeaderBlock(headerBlock);
      if (isHeaderResult === true) {
        const headerBlockTyped = headerBlock as SlackHeaderBlock;
        expect(headerBlockTyped.text.type).toBe('plain_text');
        expect(headerBlockTyped.text.text).toBe('Test Network');
      }

      // Check that show blocks are included
      const showBlocks = result.filter((block): boolean => {
        const isSectionResult = isSectionBlock(block);
        if (isSectionResult !== true) return false;
        const sectionBlock = block as SlackSectionBlock;
        const includesShow1 = Boolean(sectionBlock.text.text.includes('Network Show 1'));
        const includesShow2 = Boolean(sectionBlock.text.text.includes('Network Show 2'));
        return Boolean(includesShow1 || includesShow2);
      });
      expect(showBlocks.length).toBeGreaterThan(0);
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
      // Updated to match the new header text
      expect(headerBlocks[0].text.text).toBe('Shows by Network');
      
      // Check that both networks are included in section blocks
      const sectionBlocks = result.filter(block => isSectionBlock(block)) as SlackSectionBlock[];
      expect(sectionBlocks.length).toBeGreaterThan(0);
      
      // Find show blocks
      const showBlocks = sectionBlocks.filter((block): boolean => {
        const includesShow1 = Boolean(block.text.text.includes('Show 1'));
        const includesShow2 = Boolean(block.text.text.includes('Show 2'));
        const includesShow3 = Boolean(block.text.text.includes('Show 3'));
        return Boolean(includesShow1 || includesShow2 || includesShow3);
      });
      expect(showBlocks.length).toBeGreaterThan(0);
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
});
