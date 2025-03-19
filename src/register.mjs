// This file enables TypeScript execution using the register() API
// instead of the experimental --loader flag
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ts-node/esm to handle TypeScript files
register('ts-node/esm', pathToFileURL('./'));
