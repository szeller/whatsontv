/**
 * Fixture loading utilities
 * 
 * Core utilities for loading test fixtures from the filesystem
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the fixtures directory
const fixturesDir = path.resolve(__dirname, '../fixtures');

/**
 * Get the path to a fixture file
 * @param relativePath Path to the fixture file, relative to the fixtures directory
 * @returns The full path to the fixture file
 */
export function getFixturePath(relativePath: string): string {
  return path.join(fixturesDir, relativePath);
}

/**
 * Load a fixture file as JSON
 * @param relativePath Path to the fixture file, relative to the fixtures directory
 * @returns The parsed JSON content of the fixture file
 */
export function loadFixture<T>(relativePath: string): T {
  const fullPath = getFixturePath(relativePath);
  const fileContent = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(fileContent) as T;
}

/**
 * Load raw fixture content as a string
 * @param relativePath Path to the fixture file, relative to the fixtures directory
 * @returns The raw file content as a string
 */
export function loadFixtureString(relativePath: string): string {
  const fullPath = getFixturePath(relativePath);
  return fs.readFileSync(fullPath, 'utf-8');
}
