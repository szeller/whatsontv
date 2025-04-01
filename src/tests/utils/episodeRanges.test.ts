/**
 * Tests for the formatEpisodeRanges function
 */

import { describe, expect, it } from '@jest/globals';
import { formatEpisodeRanges } from '../../utils/showUtils.js';
import { ShowBuilder } from '../fixtures/helpers/showFixtureBuilder.js';

describe('formatEpisodeRanges', () => {
  it('should return an empty string for an empty array', () => {
    expect(formatEpisodeRanges([], false)).toBe('');
  });

  it('should format a single episode correctly', () => {
    const episodes = ShowBuilder.createEpisodeSequence(1, [1]);
    
    expect(formatEpisodeRanges(episodes, false)).toBe('S1E1');
  });

  it('should format consecutive episodes as a range', () => {
    const episodes = ShowBuilder.createEpisodeRange(1, 1, 4);
    
    expect(formatEpisodeRanges(episodes, false)).toBe('S1E1-4');
  });

  it('should format non-consecutive episodes with commas', () => {
    const episodes = ShowBuilder.createEpisodeSequence(1, [1, 3, 5]);
    
    expect(formatEpisodeRanges(episodes, false)).toBe('S1E1, S1E3, S1E5');
  });

  it('should format mixed consecutive and non-consecutive episodes', () => {
    // Combine multiple episode sequences for more complex test cases
    const episodes = [
      ...ShowBuilder.createEpisodeRange(1, 1, 3),
      ...ShowBuilder.createEpisodeSequence(1, [5]),
      ...ShowBuilder.createEpisodeRange(1, 7, 9)
    ];
    
    expect(formatEpisodeRanges(episodes, false)).toBe('S1E1-3, S1E5, S1E7-9');
  });

  it('should handle multiple seasons correctly', () => {
    const episodes = ShowBuilder.createMultiSeasonEpisodes({
      1: [1, 2],
      2: [1, 3, 4],
      3: [1]
    });
    
    expect(formatEpisodeRanges(episodes, false)).toBe('S1E1-2, S2E1, S2E3-4, S3E1');
  });

  it('should sort episodes by season and number', () => {
    // Create episodes in random order to test sorting
    const episodes = [
      ...ShowBuilder.createEpisodeSequence(2, [3]),
      ...ShowBuilder.createEpisodeSequence(1, [5]),
      ...ShowBuilder.createEpisodeSequence(2, [1]),
      ...ShowBuilder.createEpisodeSequence(1, [1, 2]),
      ...ShowBuilder.createEpisodeSequence(3, [1])
    ];
    
    expect(formatEpisodeRanges(episodes, false)).toBe('S1E1-2, S1E5, S2E1, S2E3, S3E1');
  });

  it('should handle episodes with gaps in numbering', () => {
    const episodes = ShowBuilder.createEpisodeSequence(1, [1, 10, 11, 12, 20]);
    
    expect(formatEpisodeRanges(episodes, false)).toBe('S1E1, S1E10-12, S1E20');
  });
  
  it('should format episodes with padded numbers when padEpisodeNumbers is true', () => {
    const episodes = ShowBuilder.createEpisodeSequence(1, [1, 3, 5]);
    
    expect(formatEpisodeRanges(episodes, true)).toBe('S01E01, S01E03, S01E05');
  });
});
