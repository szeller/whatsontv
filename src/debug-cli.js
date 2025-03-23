#!/usr/bin/env node

/**
 * Debug wrapper for the CLI to catch and handle errors
 */

/* eslint-disable no-console */
/* eslint-env node */

// Set up global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:');
  if (error && typeof error === 'object') {
    if (Object.getPrototypeOf(error) === null) {
      console.error('Error with null prototype detected.');
      console.error('Error properties:', Object.getOwnPropertyNames(error).join(', '));
      
      // Try to get more information about the error
      try {
        const customInspect = error[Symbol.for('nodejs.util.inspect.custom')];
        if (typeof customInspect === 'function') {
          console.error('Custom inspect result:', customInspect.call(error));
        }
      } catch (inspectError) {
        console.error('Failed to call custom inspect:', inspectError);
      }
    } else {
      console.error(error);
    }
  } else {
    console.error(error);
  }
  process.exit(1);
});

// Import and run the CLI
import('./cli.ts')
  .then(({ main }) => {
    console.log('CLI module loaded successfully, running main function...');
    return main();
  })
  .catch((error) => {
    console.error('Failed to import or run the CLI module:', error);
    process.exit(1);
  });
