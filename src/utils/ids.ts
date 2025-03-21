/**
 * Generates a unique ID string
 * @returns A random string suitable for use as an ID
 */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 13);
}
