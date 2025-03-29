/**
 * Tests for the formatEpisodeRanges function
 */

import { describe, expect, it } from '@jest/globals';
import { formatEpisodeRanges } from '../../utils/showUtils.js';
import type { Show } from '../../schemas/domain.js';

describe('formatEpisodeRanges', () => {
  /**
   * Creates a mock episode for testing
   */
  function createMockEpisode(season: number, number: number): Show {
    return {
      id: 1,
      name: 'Test Show',
      season,
      number,
      airtime: '',
      network: 'Test Network',
      type: 'scripted',
      summary: 'Test summary',
      language: 'English',
      genres: ['Drama']
    };
  }

  it('should return an empty string for an empty array', () => {
    expect(formatEpisodeRanges([])).toBe('');
  });

  it('should format a single episode correctly', () => {
    const episodes = [
      createMockEpisode(1, 1)
    ];
    
    expect(formatEpisodeRanges(episodes)).toBe('S1E1');
  });

  it('should format consecutive episodes as a range', () => {
    const episodes = [
      createMockEpisode(1, 1),
      createMockEpisode(1, 2),
      createMockEpisode(1, 3),
      createMockEpisode(1, 4)
    ];
    
    expect(formatEpisodeRanges(episodes)).toBe('S1E1-4');
  });

  it('should format non-consecutive episodes with commas', () => {
    const episodes = [
      createMockEpisode(1, 1),
      createMockEpisode(1, 3),
      createMockEpisode(1, 5)
    ];
    
    expect(formatEpisodeRanges(episodes)).toBe('S1E1, S1E3, S1E5');
  });

  it('should format mixed consecutive and non-consecutive episodes', () => {
    const episodes = [
      createMockEpisode(1, 1),
      createMockEpisode(1, 2),
      createMockEpisode(1, 3),
      createMockEpisode(1, 5),
      createMockEpisode(1, 7),
      createMockEpisode(1, 8),
      createMockEpisode(1, 9)
    ];
    
    expect(formatEpisodeRanges(episodes)).toBe('S1E1-3, S1E5, S1E7-9');
  });

  it('should handle multiple seasons correctly', () => {
    const episodes = [
      createMockEpisode(1, 1),
      createMockEpisode(1, 2),
      createMockEpisode(2, 1),
      createMockEpisode(2, 3),
      createMockEpisode(2, 4),
      createMockEpisode(3, 1)
    ];
    
    expect(formatEpisodeRanges(episodes)).toBe('S1E1-2, S2E1, S2E3-4, S3E1');
  });

  it('should sort episodes by season and number', () => {
    const episodes = [
      createMockEpisode(2, 3),
      createMockEpisode(1, 5),
      createMockEpisode(2, 1),
      createMockEpisode(1, 1),
      createMockEpisode(3, 1),
      createMockEpisode(1, 2)
    ];
    
    expect(formatEpisodeRanges(episodes)).toBe('S1E1-2, S1E5, S2E1, S2E3, S3E1');
  });

  it('should handle episodes with gaps in numbering', () => {
    const episodes = [
      createMockEpisode(1, 1),
      createMockEpisode(1, 10),
      createMockEpisode(1, 11),
      createMockEpisode(1, 12),
      createMockEpisode(1, 20)
    ];
    
    expect(formatEpisodeRanges(episodes)).toBe('S1E1, S1E10-12, S1E20');
  });
});
