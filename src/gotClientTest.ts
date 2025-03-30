/**
 * Incremental Component Test
 * 
 * This script tests components one by one to identify where failures occur
 */

// Import reflect-metadata first as it's required for tsyringe
import 'reflect-metadata';

// Import the implementations to test
import { GotHttpClientImpl } from './implementations/gotHttpClientImpl.js';

console.error('Attempting to create GotHttpClientImpl');
new GotHttpClientImpl({});
