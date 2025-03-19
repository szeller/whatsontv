import { beforeEach, describe, expect, jest, test } from '@jest/globals';

import type { Show } from '../../types/tvmaze.js';
import { formatShowDetails } from '../../utils/formatting.js';

// Strip ANSI color codes from string
const stripAnsi = (str: string): string => {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\u001b\[\d+m/g, '');
};

// Mock chalk methods to strip color codes
jest.mock('chalk', () => {
  const chalkFn = (str: string): string => str;
  chalkFn.dim = jest.fn((str: string) => str);
  chalkFn.bold = {
    cyan: jest.fn((str: string) => str)
  };
  chalkFn.cyan = jest.fn((str: string) => str);
  chalkFn.magenta = jest.fn((str: string) => str);
  chalkFn.green = jest.fn((str: string) => str);
  chalkFn.yellow = jest.fn((str: string) => str);
  return chalkFn;
});

describe('formatShowDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('formats a complete show record correctly', () => {
    const show: Show = {
      airtime: '20:00',
      name: 'Pilot',
      season: 1,
      number: 1,
      show: {
        id: 1,
        name: 'Test Show',
        type: 'Scripted',
        language: 'English',
        genres: ['Drama'],
        network: {
          id: 1,
          name: 'ABC',
          country: {
            name: 'United States',
            code: 'US',
            timezone: 'America/New_York'
          }
        },
        webChannel: null,
        image: null,
        summary: 'Test summary'
      }
    };

    const result = stripAnsi(formatShowDetails(show));
    expect(result).toContain('20:00');
    expect(result).toContain('ABC');
    expect(result).toContain('Scripted');
    expect(result).toContain('Test Show');
    expect(result).toContain('S1E1');
    expect(result).toContain('Pilot');
  });

  test('handles missing optional fields with defaults', () => {
    const show: Show = {
      airtime: '',
      name: '',
      season: 1,
      number: 1,
      show: {
        id: 1,
        name: '',
        type: '',
        language: null,
        genres: [],
        network: null,
        webChannel: null,
        image: null,
        summary: ''
      }
    };

    const result = stripAnsi(formatShowDetails(show));
    expect(result).toContain('TBA');
    expect(result).toContain('N/A');
    expect(result).toContain('Unknown');
    expect(result).toContain('Unknown Show');
    expect(result).toContain('S1E1');
  });

  test('uses webChannel name when network is not available', () => {
    const show: Show = {
      airtime: '21:00',
      name: 'Episode',
      season: 2,
      number: 3,
      show: {
        id: 1,
        name: 'Web Show',
        type: 'Reality',
        language: 'English',
        genres: [],
        network: null,
        webChannel: {
          id: 1,
          name: 'Netflix',
          country: null
        },
        image: null,
        summary: ''
      }
    };

    const result = stripAnsi(formatShowDetails(show));
    expect(result).toContain('21:00');
    expect(result).toContain('Netflix');
    expect(result).toContain('Reality');
    expect(result).toContain('Web Show');
    expect(result).toContain('S2E3');
    expect(result).toContain('Episode');
  });

  test('handles numeric fields correctly', () => {
    const show: Show = {
      airtime: '22:00',
      name: 'Test',
      season: '4' as unknown as number, // Testing string season
      number: '5' as unknown as number, // Testing string episode
      show: {
        id: '123' as unknown as number, // Testing string ID
        name: 'Number Show',
        type: 'Game Show',
        language: 'English',
        genres: [],
        network: {
          id: 1,
          name: 'CBS',
          country: null
        },
        webChannel: null,
        image: null,
        summary: ''
      }
    };

    const result = stripAnsi(formatShowDetails(show));
    expect(result).toContain('22:00');
    expect(result).toContain('CBS');
    expect(result).toContain('Game Show');
    expect(result).toContain('Number Show');
    expect(result).toContain('S4E5');
    expect(result).toContain('Test');
  });
});
