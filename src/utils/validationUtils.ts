/**
 * Utility functions for validating data using Zod schemas
 */
import { z } from 'zod';

/**
 * Validates data against a schema and returns the validated data
 * Throws an error if validation fails
 * 
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @param errorMessage Optional custom error message
 * @returns The validated data with proper type inference
 */
export function validateData<T extends z.ZodType>(
  schema: T,
  data: unknown,
  errorMessage = 'Validation error'
): z.infer<T> {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    console.error('Validation error:', result.error);
    throw new Error(errorMessage);
  }
  
  // Type assertion is safe because we've verified the data with safeParse
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return result.data;
}

/**
 * Validates data against a schema and returns the validated data or null if validation fails
 * 
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @returns The validated data with proper type inference or null if validation fails
 */
export function validateDataOrNull<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> | null {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    console.error('Validation error:', result.error);
    return null;
  }
  
  // Type assertion is safe because we've verified the data with safeParse
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return result.data;
}
