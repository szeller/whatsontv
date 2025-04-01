/**
 * Utility functions for configuration handling
 */
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Safely convert a string, comma-separated value, or array to a string array
 * @param value The value to convert (can be string, array, or undefined)
 * @param separator The separator to use for splitting strings (default: ',')
 * @returns A string array
 */
export function toStringArray(
  value: string | string[] | undefined | null,
  separator: string = ','
): string[] {
  // Handle undefined/null
  if (value === undefined || value === null) {
    return [];
  }
  
  // Handle already an array
  if (Array.isArray(value)) {
    return value.map(item => String(item));
  }
  
  // Handle string
  if (typeof value === 'string') {
    if (value.trim() === '') {
      return [];
    }
    return value.split(separator).map(item => item.trim());
  }
  
  // Handle other types by converting to string
  return [String(value)];
}

/**
 * Safely merge arrays with priority
 * @param primary Primary array (takes precedence if not empty)
 * @param fallback Fallback array (used if primary is empty)
 * @returns Merged array
 */
export function mergeArraysWithPriority<T>(
  primary: T[] | undefined | null,
  fallback: T[] | undefined | null
): T[] {
  const primaryArray = Array.isArray(primary) ? primary : [];
  const fallbackArray = Array.isArray(fallback) ? fallback : [];
  
  return primaryArray.length > 0 ? primaryArray : fallbackArray;
}

/**
 * Get directory path from import.meta.url
 * @param importMetaUrl The import.meta.url value
 * @returns The directory path
 */
export function getDirPathFromImportMeta(importMetaUrl: string): string {
  const filePath = fileURLToPath(importMetaUrl);
  return path.dirname(filePath);
}

/**
 * Resolve a path relative to a base directory
 * @param baseDir The base directory
 * @param relativePath The relative path
 * @returns The resolved absolute path
 */
export function resolveRelativePath(baseDir: string, relativePath: string): string {
  return path.resolve(baseDir, relativePath);
}

/**
 * Coerce a value to a specific fetch source type
 * @param value The value to coerce
 * @returns A valid fetch source value ('web', 'network', or 'all')
 */
export function coerceFetchSource(value: unknown): 'web' | 'network' | 'all' {
  if (typeof value !== 'string') {
    return 'all';
  }
  
  const normalized = value.toLowerCase();
  if (normalized === 'web' || normalized === 'network') {
    return normalized;
  }
  
  return 'all';
}
