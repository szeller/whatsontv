/**
 * Common test assertions for validating domain objects
 */
import type { Show, NetworkGroups } from '../../schemas/domain.js';

/**
 * Asserts that a show has the expected properties
 */
export function expectValidShow(show: Show): void {
  expect(show).toBeDefined();
  expect(show.id).toBeDefined();
  expect(typeof show.name).toBe('string');
  
  // Add more validation as needed
}

/**
 * Asserts that network groups have the expected structure
 */
export function expectValidNetworkGroups(networkGroups: NetworkGroups): void {
  expect(networkGroups).toBeDefined();
  
  // Validate structure
  Object.entries(networkGroups).forEach(([network, shows]) => {
    expect(typeof network).toBe('string');
    expect(Array.isArray(shows)).toBe(true);
    
    if (shows.length > 0) {
      expectValidShow(shows[0]);
    }
  });
}
