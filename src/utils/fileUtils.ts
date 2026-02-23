/**
 * Utility functions for file operations
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AppConfig } from '../types/configTypes.js';

/**
 * Check if a file exists
 * @param filePath Path to the file
 * @returns True if the file exists
 */
export function fileExists(filePath: string): boolean {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return fs.existsSync(filePath);
}

/**
 * Read a file as text
 * @param filePath Path to the file
 * @returns File contents as string
 */
export function readFile(filePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
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
 * Get the config file path
 * Priority: CONFIG_FILE env var > relative path to config.json
 * @param importMetaUrl import.meta.url value
 * @param configFileName Optional config file name (default: 'config.json')
 * @returns Absolute path to the config file
 */
export function getConfigFilePath(
  importMetaUrl: string,
  configFileName = 'config.json'
): string {
  // Check for CONFIG_FILE env var first (used in Lambda)
  const envConfigFile = process.env.CONFIG_FILE;
  if (envConfigFile !== undefined && envConfigFile.trim() !== '') {
    return envConfigFile;
  }

  // Fall back to relative path from module
  const filePath = getFilePath(importMetaUrl);
  const dirname = getDirname(filePath);
  return path.resolve(dirname, '../../../', configFileName);
}
