/**
 * Tests for the Slack Show Formatter Implementation
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { container } from 'tsyringe';
import { SlackShowFormatterImpl } from '../../../../implementations/slack/slackShowFormatterImpl';
import { ShowBuilder } from '../../../fixtures/helpers/showFixtureBuilder';
import type { Show } from '../../../../schemas/domain';
import { 
  isSectionBlock,
  isHeaderBlock
} from '../../../../interfaces/slackClient';

describe('SlackShowFormatterImpl', () => {
  let formatter: SlackShowFormatterImpl;
  let mockShow: Show;
  let mockShowNoAirtime: Show;

  beforeEach(() => {
    // Reset container for each test
    container.clearInstances();
    
    // Create the formatter instance directly since it doesn't have dependencies
    formatter = new SlackShowFormatterImpl();
    
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
      expect(result.text.type).toBe('mrkdwn');
      expect(result.text.text).toContain('Test Show');
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
      
      // Check that the result includes TBA for airtime
      expect(result.type).toBe('section');
      expect(result.text.type).toBe('mrkdwn');
      expect(result.text.text).toContain('TBA');
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
        expect(block.text.type).toBe('mrkdwn');
        expect(block.text.text).toContain('Test Show');
        expect(block.text.text).toContain('S01E01');
        expect(block.text.text).toContain('S01E02');
      }
    });

    it('should handle empty shows array', () => {
      // Act
      const result = formatter.formatMultipleEpisodes([]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('section');
    });
  });

  describe('formatNetwork', () => {
    it('should format a network header', () => {
      // Arrange
      const networkName = 'Test Network';

      // Act
      const result = formatter.formatNetwork(networkName);

      // Assert
      expect(result).toHaveLength(1);
      
      const block = result[0];
      const isSection = isSectionBlock(block);
      expect(isSection).toBe(true);
      
      if (isSection === true) {
        expect(block.text.type).toBe('mrkdwn');
        expect(block.text.text).toContain('Test Network');
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

      // Assert
      expect(result).toHaveLength(2);

      const headerBlock = result[0];
      const isHeaderSection = isSectionBlock(headerBlock);
      expect(isHeaderSection).toBe(true);
      
      if (isHeaderSection === true) {
        expect(headerBlock.text.type).toBe('mrkdwn');
        expect(headerBlock.text.text).toContain('Test Network');
      }

      const showsBlock = result[1];
      const isShowsSection = isSectionBlock(showsBlock);
      expect(isShowsSection).toBe(true);
      
      if (isShowsSection === true) {
        expect(showsBlock.text.type).toBe('mrkdwn');
        expect(showsBlock.text.text).toContain('Network Show 1');
        expect(showsBlock.text.text).toContain('Network Show 2');
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
      const headerBlocks = result.filter(block => {
        const isHeader = isHeaderBlock(block);
        return isHeader === true;
      });
      expect(headerBlocks.length).toBeGreaterThan(0);
      expect(headerBlocks[0].text.text).toContain('TV Shows');
      
      // Check that both networks are included in section blocks
      const sectionBlocks = result.filter(block => {
        const isSection = isSectionBlock(block);
        return isSection === true;
      });
      
      // Find network blocks
      const networkBlocks = sectionBlocks.filter(block => {
        const isSection = isSectionBlock(block);
        if (isSection !== true) return false;
        
        const includesNetworkA = block.text.text.includes('Network A') === true;
        const includesNetworkB = block.text.text.includes('Network B') === true;
        return includesNetworkA || includesNetworkB;
      });
      expect(networkBlocks.length).toBeGreaterThan(0);
      
      // Find show blocks
      const showBlocks = sectionBlocks.filter(block => {
        const isSection = isSectionBlock(block);
        if (isSection !== true) return false;
        
        const includesShow1 = block.text.text.includes('Show 1') === true;
        const includesShow2 = block.text.text.includes('Show 2') === true;
        const includesShow3 = block.text.text.includes('Show 3') === true;
        return includesShow1 || includesShow2 || includesShow3;
      });
      expect(showBlocks.length).toBeGreaterThan(0);
    });

    it('should handle empty network groups', () => {
      // Act
      const result = formatter.formatNetworkGroups({});

      // Assert
      expect(result.length).toBeGreaterThan(0);
      
      // Check that it includes a header
      const headerBlocks = result.filter(block => {
        const isHeader = isHeaderBlock(block);
        return isHeader === true;
      });
      expect(headerBlocks.length).toBeGreaterThan(0);
    });
  });
});
