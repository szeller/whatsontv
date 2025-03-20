// Type definitions for Got mock in tests
import { jest } from '@jest/globals';

declare module 'got' {
  // Define the type for Got's response
  export interface Options {
    // Add a property to avoid empty interface warning
    _dummy?: unknown;
  }
  
  // Prefix unused type parameters with underscore
  export interface Response<_T = unknown> {
    body: string;
    statusCode: number;
    headers: Record<string, string>;
  }

  // Prefix unused interface with underscore
  export interface _GotError {
    response?: {
      statusCode: number;
      statusMessage: string;
      body: string;
    };
    code?: string;
    message: string;
  }

  // Define the Got function interface
  export interface Got {
    get: jest.Mock;
    post: jest.Mock;
  }
  
  // Export the Got function
  const got: Got & {
    extend: jest.Mock;
  };
  
  export default got;
}
