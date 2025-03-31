/**
 * Tests for the formatEpisodeRanges function
 */

import { describe, expect, it } from '@jest/globals';
import { formatEpisodeRanges } from '../../utils/showUtils.js';
import { ShowBuilder } from '../fixtures/helpers/showFixtureBuilder.js';
import type { Show } from '../../schemas/domain.js';

describe('formatEpisodeRanges', () => {
  /**
   * Creates a mock episode for testing
   */
  function createEpisode(season: number, number: number): Show {
    return new ShowBuilder()
      .withId(1)
      .withName('Test Show')
      .withEpisode(season, number)
      .withAirtime('')
      .withNetwork('Test Network')
      .withType('scripted')
      .withSummary('Test summary')
      .withLanguage('English')
      .withGenres(['Drama'])
      .build();
  }

  it('should return an empty string for an empty array', () => {
    expect(formatEpisodeRanges([])).toBe('');
  });

  it('should format a single episode correctly', () => {
    const episodes = [
      createEpisode(1, 1)
    ];
    
    expect(formatEpisodeRanges(episodes)).toBe('S1E1');
  });

  it('should format consecutive episodes as a range', () => {
    const episodes = [
      createEpisode(1, 1),
      createEpisode(1, 2),
      createEpisode(1, 3),
      createEpisode(1, 4)
    ];
    
    expect(formatEpisodeRanges(episodes)).toBe('S1E1-4');
  });

  it('should format non-consecutive episodes with commas', () => {
    const episodes = [
      createEpisode(1, 1),
      createEpisode(1, 3),
      createEpisode(1, 5)
    ];
    
    expect(formatEpisodeRanges(episodes)).toBe('S1E1, S1E3, S1E5');
  });

  it('should format mixed consecutive and non-consecutive episodes', () => {
    const episodes = [
      createEpisode(1, 1),
      createEpisode(1, 2),
      createEpisode(1, 3),
      createEpisode(1, 5),
      createEpisode(1, 7),
      createEpisode(1, 8),
      createEpisode(1, 9)
    ];
    
    expect(formatEpisodeRanges(episodes)).toBe('S1E1-3, S1E5, S1E7-9');
  });

  it('should handle multiple seasons correctly', () => {
    const episodes = [
      createEpisode(1, 1),
      createEpisode(1, 2),
      createEpisode(2, 1),
      createEpisode(2, 3),
      createEpisode(2, 4),
      createEpisode(3, 1)
    ];
    
    expect(formatEpisodeRanges(episodes)).toBe('S1E1-2, S2E1, S2E3-4, S3E1');
  });

  it('should sort episodes by season and number', () => {
    const episodes = [
      createEpisode(2, 3),
      createEpisode(1, 5),
      createEpisode(2, 1),
      createEpisode(1, 1),
      createEpisode(3, 1),
      createEpisode(1, 2)
    ];
    
    expect(formatEpisodeRanges(episodes)).toBe('S1E1-2, S1E5, S2E1, S2E3, S3E1');
  });

  it('should handle episodes with gaps in numbering', () => {
    const episodes = [
      createEpisode(1, 1),
      createEpisode(1, 10),
      createEpisode(1, 11),
      createEpisode(1, 12),
      createEpisode(1, 20)
    ];
    
    expect(formatEpisodeRanges(episodes)).toBe('S1E1, S1E10-12, S1E20');
  });
});
