/**
 * Utilities for working with Jest in a type-safe way
 */
import { jest } from '@jest/globals';

/**
 * Creates a typed Jest mock function
 */
export function createTypedMock<T extends (...args: unknown[]) => unknown>(): 
  jest.MockedFunction<T> {
  return jest.fn() as unknown as jest.MockedFunction<T>;
}

/**
 * Creates a typed Jest spy on an object method
 * This simpler version avoids complex type issues with Jest's spyOn
 */
export function createTypedSpy<T extends object, K extends keyof T>(
  obj: T,
  method: K
): ReturnType<typeof jest.spyOn> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jest.spyOn(obj as any, method as any);
}

/**
 * Creates a mock implementation with the specified behavior
 */
export function createMockImplementation<T extends object>(
  implementation: Partial<Record<keyof T, unknown>> = {}
): jest.Mocked<T> {
  const mockedMethods = {} as Record<keyof T, jest.Mock>;
  for (const [key, value] of Object.entries(implementation)) {
    mockedMethods[key as keyof T] = typeof value === 'function'
      ? jest.fn(value as (...args: unknown[]) => unknown)
      : jest.fn(() => value);
  }

  return mockedMethods as unknown as jest.Mocked<T>;
}
