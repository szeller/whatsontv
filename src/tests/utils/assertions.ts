/**
 * Custom Jest assertions for WhatsOnTV tests
 * 
 * This file extends Jest with domain-specific assertions that make tests
 * more expressive and easier to read.
 */
import type { Show, NetworkGroups } from '../../schemas/domain.js';

// We need to augment the Jest types to add our custom matchers
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      /**
       * Verifies that the received value is a valid Show object with all required properties
       */
      toBeValidShow(): R;
      
      /**
       * Verifies that the received value is a valid Network object with all required properties
       */
      toBeValidNetwork(): R;
      
      /**
       * Verifies that a mock function was called with an object that matches
       * at least the expected show properties (partial match)
       */
      toHaveBeenCalledWithShow(expectedShow: Partial<Show>): R;
      
      /**
       * Verifies that a mock function was called with an array of shows that
       * includes a show matching the expected properties
       */
      toHaveBeenCalledWithShowsIncluding(expectedShow: Partial<Show>): R;
      
      /**
       * Verifies that the received value is a valid NetworkGroups object
       */
      toBeValidNetworkGroups(): R;
    }
  }
}

// Implementation of custom matchers
expect.extend({
  toBeValidShow(received: unknown) {
    const isValid = 
      received !== null &&
      received !== undefined &&
      typeof received === 'object' &&
      typeof (received as Show).id === 'number' &&
      typeof (received as Show).name === 'string' &&
      typeof (received as Show).type === 'string' &&
      Array.isArray((received as Show).genres);
    
    return {
      message: () => isValid 
        ? `Expected ${JSON.stringify(received)} not to be a valid show` 
        : `Expected ${JSON.stringify(received)} to be a valid show`,
      pass: isValid
    };
  },
  
  toBeValidNetwork(received: unknown) {
    const isValid = 
      received !== null &&
      received !== undefined &&
      typeof received === 'object' &&
      typeof (received as { name: string }).name === 'string';
    
    return {
      message: () => isValid 
        ? `Expected ${JSON.stringify(received)} not to be a valid network` 
        : `Expected ${JSON.stringify(received)} to be a valid network`,
      pass: isValid
    };
  },
  
  toHaveBeenCalledWithShow(received: jest.Mock, expectedShow: Partial<Show>) {
    // Check if the mock was called with an object matching the expected show properties
    const calls = received.mock.calls.filter(call => {
      const arg = call[0];
      return arg !== null && 
        arg !== undefined &&
        typeof arg === 'object' && 
        Object.entries(expectedShow).every(([key, value]) => {
          return (arg as Record<string, unknown>)[key] === value;
        });
    });
    
    const pass = calls.length > 0;
    
    return {
      message: () => pass 
        ? `Expected mock not to be called with show matching ${JSON.stringify(expectedShow)}` 
        : `Expected mock to be called with show matching ${JSON.stringify(expectedShow)}`,
      pass
    };
  },
  
  toHaveBeenCalledWithShowsIncluding(received: jest.Mock, expectedShow: Partial<Show>) {
    // Check if the mock was called with an array containing a show matching the expected properties
    const calls = received.mock.calls.filter(call => {
      const shows = call[0];
      return Array.isArray(shows) && shows.some(show => {
        return show !== null && 
          show !== undefined &&
          Object.entries(expectedShow).every(([key, value]) => {
            return (show as Record<string, unknown>)[key] === value;
          });
      });
    });
    
    const pass = calls.length > 0;
    
    return {
      message: () => pass 
        ? `Expected mock not to be called with shows including ${JSON.stringify(expectedShow)}` 
        : `Expected mock to be called with shows including ${JSON.stringify(expectedShow)}`,
      pass
    };
  },
  
  toBeValidNetworkGroups(received: unknown) {
    // Check if the received value is a valid NetworkGroups object
    let isValid = 
      received !== null &&
      received !== undefined &&
      typeof received === 'object';
    
    // If basic check passes, validate structure
    if (isValid) {
      try {
        const networkGroups = received as NetworkGroups;
        
        // Check each network entry
        Object.entries(networkGroups).forEach(([network, shows]) => {
          if (typeof network !== 'string' || !Array.isArray(shows)) {
            isValid = false;
            return;
          }
          
          // Check shows if any exist
          if (shows.length > 0) {
            const firstShow = shows[0];
            if (typeof firstShow !== 'object' || typeof firstShow.name !== 'string') {
              isValid = false;
            }
          }
        });
      } catch (_) {
        // If any error occurs during validation, the object is not valid
        isValid = false;
      }
    }
    
    return {
      message: () => isValid 
        ? `Expected ${JSON.stringify(received)} not to be valid network groups` 
        : `Expected ${JSON.stringify(received)} to be valid network groups`,
      pass: isValid
    };
  }
});

/**
 * Utility function to validate a Show object structure
 * This can be used in regular assertions outside of expect()
 */
export function expectValidShow(show: unknown): void {
  expect(show).toBeValidShow();
  
  const typedShow = show as Show;
  expect(typedShow.id).toBeDefined();
  expect(typeof typedShow.name).toBe('string');
  
  // Add more detailed validations as needed
}

/**
 * Utility function to validate a Network object structure
 * This can be used in regular assertions outside of expect()
 */
export function expectValidNetwork(network: unknown): void {
  expect(network).toBeValidNetwork();
}

/**
 * Asserts that network groups have the expected structure
 */
export function expectValidNetworkGroups(networkGroups: NetworkGroups): void {
  expect(networkGroups).toBeValidNetworkGroups();
  
  // Additional validation
  Object.entries(networkGroups).forEach(([network, shows]) => {
    expect(typeof network).toBe('string');
    expect(Array.isArray(shows)).toBe(true);
    
    if (shows.length > 0) {
      expectValidShow(shows[0]);
    }
  });
}

/**
 * Create a test show with customizable properties
 */
export function createTestShow(overrides: Partial<Show> = {}): Show {
  return {
    id: 1,
    name: 'Test Show',
    type: 'scripted',
    language: 'English',
    genres: ['Drama'],
    network: 'Test Network',
    summary: '<p>Test summary</p>',
    airtime: '20:00',
    season: 1,
    number: 1,
    ...overrides
  };
}

/**
 * Create an array of test shows with customizable properties
 */
export function createTestShows(
  count: number, 
  overridesFn?: (index: number) => Partial<Show>
): Show[] {
  return Array.from({ length: count }).map((_, index) => {
    const baseOverrides = {
      id: index + 1,
      name: `Test Show ${index + 1}`
    };
    
    const customOverrides = overridesFn ? overridesFn(index) : {};
    
    return createTestShow({
      ...baseOverrides,
      ...customOverrides
    });
  });
}
