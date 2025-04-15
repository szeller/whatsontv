/**
 * Utility functions for file operations
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { AppConfig } from '../types/configTypes.js';

/**
 * Check if a file exists
 * @param filePath Path to the file
 * @returns True if the file exists
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Read a file as text
 * @param filePath Path to the file
 * @returns File contents as string
 */
export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Parse a JSON config file
 * @param fileContents File contents as string
 * @returns Parsed config object
 */
export function parseConfigFile(fileContents: string): Partial<AppConfig> {
  return JSON.parse(fileContents) as Partial<AppConfig>;
}

/**
 * Handle config file errors
 * @param error Error that occurred
 */
export function handleConfigError(error: unknown): void {
  if (error instanceof Error) {
    console.error(`Warning: Could not load config.json: ${error.message}`);
  } else {
    console.error(`Warning: Could not load config.json: ${String(error)}`);
  }
}

/**
 * Get the directory name from a file path
 * @param filePath File path
 * @returns Directory name
 */
export function getDirname(filePath: string): string {
  return path.dirname(filePath);
}

/**
 * Get the file path from import.meta.url
 * @param importMetaUrl import.meta.url value
 * @returns Absolute file path
 */
export function getFilePath(importMetaUrl: string): string {
  return fileURLToPath(importMetaUrl);
}

/**
 * Get the config file path relative to the current module
 * @param importMetaUrl import.meta.url value
 * @param configFileName Optional config file name (default: 'config.json')
 * @returns Absolute path to the config file
 */
export function getConfigFilePath(
  importMetaUrl: string,
  configFileName: string = 'config.json'
): string {
  const filePath = getFilePath(importMetaUrl);
  const dirname = getDirname(filePath);
  return path.resolve(dirname, '../../../', configFileName);
}
