# TypeScript Path Aliases Investigation

## Overview

This document summarizes our efforts to implement path aliases in the WhatsOnTV project, the challenges encountered, and recommendations for future approaches.

## Goals

1. Simplify imports by using path aliases (e.g., `@interfaces/` instead of relative paths like `../../interfaces/`)
2. Maintain compatibility with both VS Code IDE and runtime environments
3. Avoid having to add `.js` extensions to imports in TypeScript files
4. Ensure consistent import behavior across development and testing

## What We Tried

### Approach 1: Path Aliases in tsconfig.json

We modified the main `tsconfig.json` to include path mappings:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@interfaces/*": ["src/interfaces/*"],
      "@implementations/*": ["src/implementations/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"],
      "@schemas/*": ["src/schemas/*"],
      "@tests/*": ["src/tests/*"],
      "@fixtures/*": ["src/tests/fixtures/*"]
    }
  }
}
```

**Results**:
- VS Code could resolve imports without extensions, but runtime execution failed
- Jest tests required separate path mappings in the Jest configuration

### Approach 2: IDE-specific TypeScript Configuration

We created a separate `tsconfig.vscode.json` specifically for VS Code:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "allowImportingTsExtensions": true,
    "allowSyntheticDefaultImports": true,
    "moduleResolution": "NodeNext",
    "module": "NodeNext",
    "target": "ES2022",
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "noEmit": true,
    "paths": {
      "@interfaces/*": ["src/interfaces/*"],
      "@implementations/*": ["src/implementations/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"],
      "@schemas/*": ["src/schemas/*"],
      "@tests/*": ["src/tests/*"],
      "@fixtures/*": ["src/tests/fixtures/*"]
    }
  }
}
```

And updated `.vscode/settings.json` to use this configuration.

**Results**:
- VS Code resolved path aliases but still had issues with `.js` extensions in imports
- Runtime execution still failed due to module resolution differences

### Approach 3: Runtime Path Resolution with tsconfig-paths

We enhanced `register.mjs` to use the `tsconfig-paths` package:

```javascript
// Load tsconfig-paths to resolve path aliases
const tsConfigPaths = require('tsconfig-paths');

// Load the tsconfig.json file
const { paths, baseUrl } = require('../tsconfig.json').compilerOptions;

// Enhanced path mapping to handle imports without .js extensions
const enhancedPaths = {};
Object.keys(paths).forEach(key => {
  const pathValues = Array.isArray(paths[key]) ? paths[key] : [paths[key]];
  enhancedPaths[key] = pathValues;
  
  // Add mappings for paths without .js extension
  if (key.endsWith('/*')) {
    const keyWithoutExt = key.replace('/*', '/*.js');
    enhancedPaths[keyWithoutExt] = pathValues.map(p => 
      p.endsWith('/*') ? p.replace('/*', '/*.ts') : p
    );
  }
});

// Register the path aliases with enhanced mappings
tsConfigPaths.register({
  baseUrl: resolve(__dirname, '..', baseUrl),
  paths: enhancedPaths
});
```

**Results**:
- Some runtime path resolution worked, but inconsistently
- Created conflicts with the ESM loader system

## Major Challenges Encountered

1. **ESM vs CommonJS Conflict**: The project uses ESM modules, but path alias resolution libraries like `tsconfig-paths` primarily support CommonJS

2. **Extension Requirements in ESM**: ECMAScript modules require file extensions in imports, but TypeScript lets you omit them, creating a mismatch

3. **VS Code vs Runtime Mismatch**: VS Code's TypeScript server handles path aliases differently than Node.js at runtime

4. **Jest Configuration**: Jest requires its own module mapper configuration that must be kept in sync with TypeScript paths

5. **On-the-fly Compilation**: Our use of ts-node for on-the-fly compilation added another layer of complexity to path resolution

## Current Solution

After experimentation, we've temporarily reverted to using relative imports with explicit `.js` extensions. This approach:

- Works consistently in both VS Code and at runtime
- Avoids configuration complexity
- Ensures compatibility with ESM modules
- Maintains Jest test functionality

## Recommendations for Future Implementation

### Option 1: Explicit Build Step

If we're willing to add a build step before running:

1. Configure TypeScript to output compiled JavaScript with correct extensions
2. Use a package like `tsc-alias` to rewrite path aliases during build
3. Run the compiled JavaScript instead of on-the-fly TypeScript

**Pro**: Clean separation between development and runtime environments
**Con**: Requires a build step, which adds complexity to development workflow

### Option 2: Enhanced ESM Loader

1. Use an ESM loader that better supports path aliases, such as:
   - `@esbuild-kit/esm-loader`
   - `tsconfig-paths-module-resolver`

2. Configure the loader to handle both path aliases and extension differences

**Pro**: Maintains on-the-fly execution
**Con**: Still experimental, may have compatibility issues

### Option 3: Bundled Development Environment

1. Use a bundler like esbuild or Vite for development
2. Configure the bundler to handle path aliases
3. Use the bundler's dev server for rapid development

**Pro**: Modern, fast development experience with good path alias support
**Con**: Significant change to development workflow

## NPM Modules Worth Investigating

1. **tsconfig-paths-webpack-plugin**: If moving to a webpack-based setup
2. **tsconfig-paths-module-resolver**: ESM-compatible path alias resolver
3. **@esbuild-kit/esm-loader**: Modern ESM loader with good TypeScript support
4. **ts-node with projectReferences**: Using TypeScript project references for better module resolution

## Conclusion

Path aliases offer cleaner imports but come with significant configuration challenges in an ESM TypeScript project. For the WhatsOnTV project, the most promising approach would be to:

1. Investigate `@esbuild-kit/esm-loader` as a replacement for our current ts-node setup
2. Consider moving to a more integrated development environment with bundling
3. If immediate path aliases are needed, implement a proper build step with `tsc-alias`

The immediate recommendation is to continue with explicit relative imports using `.js` extensions until we can implement a more comprehensive solution that works reliably across all environments.
