/**
 * HTTP Schema Definitions
 * 
 * This file contains schema definitions for HTTP requests and responses
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
 * Request options type
 */
export type RequestOptions = z.infer<typeof requestOptionsSchema>;

/**
 * HTTP response type
 */
export type HttpResponse = z.infer<typeof httpResponseSchema>;
