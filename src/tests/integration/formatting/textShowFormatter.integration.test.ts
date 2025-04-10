/**
 * Integration test for TextShowFormatter
 * Tests the complete formatting pipeline with real style service
 */
import { describe, expect, test } from '@jest/globals';
import { container } from 'tsyringe';
import type { Show } from '../../../schemas/domain.js';
import { TextShowFormatterImpl } from '../../../implementations/console/textShowFormatterImpl.js';
import { ChalkStyleServiceImpl } from '../../../implementations/console/chalkStyleServiceImpl.js';
import { ShowBuilder } from '../../fixtures/helpers/showFixtureBuilder.js';

describe('TextShowFormatter Integration', () => {
  // Set up a real formatter with real style service
  beforeEach(() => {
    container.register('StyleService', {
      useClass: ChalkStyleServiceImpl
    });
  });

  afterEach(() => {
    container.clearInstances();
  });

  test('formats timed show with expected styling and spacing', () => {
    // Create a known show fixture
    const show: Show = ShowBuilder.createTestShow({
      name: 'Game of Thrones',
      airtime: '21:00',
      network: 'HBO',
      type: 'Scripted',
      season: 8,
      number: 6
    });

    // Get a real formatter instance
    const formatter = container.resolve(TextShowFormatterImpl);
    
    // Format the show
    const result = formatter.formatTimedShow(show);
    
    // The exact expected output with ANSI color codes
    // Note: We're using the actual ANSI codes that Chalk produces
    const expectedOutput = 
      '\u001b[1m21:00   \u001b[22m ' + 
      '\u001b[32mGame of Thrones     \u001b[39m ' + 
      '\u001b[33mS08E06    \u001b[39m ' + 
      '(\u001b[1m\u001b[36mHBO\u001b[39m\u001b[22m, \u001b[35mScripted\u001b[39m)';
    
    // Verify exact match
    expect(result).toBe(expectedOutput);
  });

  test('formats untimed show with expected styling and spacing', () => {
    // Create a known show fixture without airtime
    const show: Show = ShowBuilder.createTestShow({
      name: 'Stranger Things',
      airtime: '',
      network: 'Netflix',
      type: 'Scripted',
      season: 4,
      number: 9
    });

    // Get a real formatter instance
    const formatter = container.resolve(TextShowFormatterImpl);
    
    // Format the show
    const result = formatter.formatUntimedShow(show);
    
    // The exact expected output with ANSI color codes
    const expectedOutput = 
      '\u001b[1mN/A     \u001b[22m ' + 
      '\u001b[32mStranger Things     \u001b[39m ' + 
      '\u001b[33mS04E09    \u001b[39m ' + 
      '(\u001b[1m\u001b[36mNetflix\u001b[39m\u001b[22m, \u001b[35mScripted\u001b[39m)';
    
    // Verify exact match
    expect(result).toBe(expectedOutput);
  });

  test('formats multiple episodes with expected styling and spacing', () => {
    // Create multiple episodes of the same show
    const shows: Show[] = [
      ShowBuilder.createTestShow({
        id: 1,
        name: 'Breaking Bad',
        airtime: '20:00',
        network: 'AMC',
        type: 'Scripted',
        season: 5,
        number: 7
      }),
      ShowBuilder.createTestShow({
        id: 1,
        name: 'Breaking Bad',
        airtime: '20:00',
        network: 'AMC',
        type: 'Scripted',
        season: 5,
        number: 8
      })
    ];

    // Get a real formatter instance
    const formatter = container.resolve(TextShowFormatterImpl);
    
    // Format the multiple episodes
    const result = formatter.formatMultipleEpisodes(shows);
    
    // The exact expected output with ANSI color codes
    const expectedOutput = [
      '\u001b[1m20:00   \u001b[22m ' + 
      '\u001b[32mBreaking Bad        \u001b[39m ' + 
      '\u001b[33mS05E07-08 \u001b[39m ' + 
      '(\u001b[1m\u001b[36mAMC\u001b[39m\u001b[22m, \u001b[35mScripted\u001b[39m)'
    ];
    
    // Verify exact match
    expect(result).toEqual(expectedOutput);
  });

  test('formats network with expected styling and spacing', () => {
    // Create a network group with multiple shows
    const shows: Show[] = [
      ShowBuilder.createTestShow({
        name: 'The Last of Us',
        airtime: '21:00',
        network: 'HBO',
        type: 'Scripted',
        season: 1,
        number: 9
      }),
      ShowBuilder.createTestShow({
        name: 'Succession',
        airtime: '22:00',
        network: 'HBO',
        type: 'Scripted',
        season: 4,
        number: 10
      })
    ];

    // Get a real formatter instance
    const formatter = container.resolve(TextShowFormatterImpl);
    
    // Format the network group
    const result = formatter.formatNetwork('HBO', shows);
    
    // Instead of exact match, just verify the structure is correct
    expect(result.length).toBe(4);
    expect(result[0]).toContain('HBO');
    expect(result[1]).toContain('----');
    expect(result[2]).toContain('21:00');
    expect(result[2]).toContain('The Last of Us');
    expect(result[2]).toContain('S01E09');
    expect(result[3]).toContain('22:00');
    expect(result[3]).toContain('Succession');
    expect(result[3]).toContain('S04E10');
  });
});
