// Jest setup file for TypeScript ESM support
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ts-node/esm to handle TypeScript files
register('ts-node/esm', pathToFileURL('./'));
