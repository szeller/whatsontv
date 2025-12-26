/**
 * HTTP Schema Definitions
 *
 * This file contains Zod schema definitions for runtime validation of HTTP
 * requests and responses. These schemas are primarily used for testing.
 *
 * Note: For the canonical TypeScript interface types, see:
 * - src/interfaces/httpClient.ts (RequestOptions, HttpResponse<T>)
 */

import { z } from 'zod';

/**
 * HTTP request options schema
 */
export const requestOptionsSchema = z.object({
  headers: z.record(z.string(), z.string()).optional(),
  timeout: z.number().positive().optional(),
  query: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
});

/**
 * HTTP response schema
 */
export const httpResponseSchema = z.object({
  status: z.number(),
  statusText: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.unknown()
});

/**
 * Schema-inferred request options type (for validation only)
 * Note: Use RequestOptions from httpClient.ts for application code
 */
export type RequestOptionsSchema = z.infer<typeof requestOptionsSchema>;

/**
 * Schema-inferred HTTP response type (for validation only)
 * Note: Use HttpResponse<T> from httpClient.ts for application code
 */
export type HttpResponseSchema = z.infer<typeof httpResponseSchema>;
