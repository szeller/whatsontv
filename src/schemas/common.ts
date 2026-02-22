/**
 * Common schema utilities for validation and transformation
 */
import { z } from 'zod';

/**
 * Converts mixed input (string, number, null, undefined) to a number
 * with proper error handling and validation
 */
export const numberFromMixed = z.union([
  z.number(),
  z.string().transform((val, ctx) => {
    const parsed = Number.parseInt(val, 10);
    if (Number.isNaN(parsed)) {
      ctx.addIssue({
        code: 'custom',
        message: `Could not parse "${val}" as a number`
      });
      return z.NEVER;
    }
    return parsed;
  }),
  z.null().transform(() => 0),
  z.undefined().transform(() => 0)
]);

/**
 * Handles nullable string values with proper transformation
 */
export const nullableString = z.union([
  z.string(),
  z.null(),
  z.undefined().transform(() => null)
]);

/**
 * Date string in YYYY-MM-DD format with validation
 */
export const dateString = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Invalid date format. Expected YYYY-MM-DD'
);
