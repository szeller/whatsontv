/**
 * Base options interface for all mock factories
 */
export interface MockOptions<T> {
  /** Default return value for methods that don't have specific implementations */
  defaultReturn?: T;
  
  /** Custom implementations for specific methods */
  implementation?: Partial<Record<keyof T, jest.Mock>>;
  
  /** Whether methods should throw errors by default */
  throwError?: boolean | Error;
}
