/**
 * Utilities for working with Jest in a type-safe way
 */
import { jest } from '@jest/globals';
import type { SpyInstance } from 'jest-mock';

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
): SpyInstance {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jest.spyOn(obj as any, method as any);
}

/**
 * Creates a mock implementation with the specified behavior
 */
export function createMockImplementation<T extends object>(
  implementation: Partial<Record<keyof T, unknown>> = {}
): jest.Mocked<T> {
  const mockedMethods = Object.entries(implementation).reduce(
    (acc, [key, value]) => {
      acc[key as keyof T] = typeof value === 'function' 
        ? jest.fn(value as (...args: unknown[]) => unknown) 
        : jest.fn(() => value);
      return acc;
    },
    {} as Record<keyof T, jest.Mock>
  );
  
  return mockedMethods as unknown as jest.Mocked<T>;
}
