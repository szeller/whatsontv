/**
 * Utilities for working with the dependency injection container in tests
 */
import { container } from '../../container.js';
import type { DependencyContainer } from 'tsyringe';

/**
 * Registers a mock instance in the container
 * @param token The token to register the mock with
 * @param mockInstance The mock instance to register
 * @param customContainer Optional custom container (defaults to global container)
 */
export function registerMockInContainer<T>(
  token: string | symbol,
  mockInstance: T,
  customContainer: DependencyContainer = container
): void {
  customContainer.registerInstance(token, mockInstance);
}

/**
 * Resets the container to its initial state
 * @param customContainer Optional custom container (defaults to global container)
 */
export function resetContainer(
  customContainer: DependencyContainer = container
): void {
  customContainer.clearInstances();
}
