# ESLint v9 Upgrade Strategy

## Current Setup

- **ESLint**: v8.57.0 with flat config format (eslint.config.js)
- **TypeScript ESLint**: @typescript-eslint/eslint-plugin v7.0.0, @typescript-eslint/parser v7.0.0
- **Jest Integration**: jest-runner-eslint v2.2.1 configured as a project in jest.config.mjs

## ESLint v9 Breaking Changes Analysis

### Key Breaking Changes

1. **Node.js Requirements**:
   - Requires Node.js v18.18.0+ or v20.9.0+
   - Current project is compatible with this requirement

2. **Configuration Format**:
   - Flat config (eslint.config.js) is now the default
   - Our project already uses this format, so no changes needed

3. **ESLint API Changes**:
   - FlatESLint class renamed to ESLint
   - Legacy ESLint class renamed to LegacyESLint
   - These changes may affect jest-runner-eslint

4. **Removed Features**:
   - Several formatters removed and moved to separate packages
   - require-jsdoc and valid-jsdoc rules removed (not used in our project)

## jest-runner-eslint Compatibility

The jest-runner-eslint package (v2.2.1) was designed for ESLint v8 and may have compatibility issues with ESLint v9 due to the following:

1. **API Changes**: ESLint v9 renamed the main classes, which could break jest-runner-eslint's integration
2. **Configuration Format**: jest-runner-eslint may expect the legacy configuration format

## Upgrade Strategy

### Phase 1: Environment Preparation

1. Create a feature branch for the upgrade
2. Update package.json to specify ESLint v9 and related dependencies
3. Add fallback mechanisms to ensure compatibility

### Phase 2: ESLint v9 Integration

1. **Update Dependencies**:
   ```json
   {
     "devDependencies": {
       "eslint": "^9.0.0",
       "@eslint/js": "^9.0.0",
       "@typescript-eslint/eslint-plugin": "^7.0.0",
       "@typescript-eslint/parser": "^7.0.0"
     }
   }
   ```

2. **Create ESLint Wrapper for jest-runner-eslint**:
   - Create a custom wrapper script that bridges ESLint v9 API with jest-runner-eslint expectations
   - Place in `scripts/eslint-jest-wrapper.js`

3. **Update Jest Configuration**:
   - Modify jest.config.mjs to use the wrapper script
   - Ensure the lint project continues to work with ESLint v9

### Phase 3: Testing and Validation

1. Run the test suite to verify ESLint integration works
2. Validate that all linting rules continue to function correctly
3. Ensure pre-commit hooks work properly

### Phase 4: Fallback Plan

If jest-runner-eslint proves incompatible with ESLint v9:

1. **Option A**: Fork and update jest-runner-eslint to support ESLint v9
2. **Option B**: Replace jest-runner-eslint with a custom implementation using ESLint v9 API directly
3. **Option C**: Revert to ESLint v8 until jest-runner-eslint is officially updated

## Implementation Details

### ESLint Wrapper Script

```javascript
// scripts/eslint-jest-wrapper.js
import { ESLint } from 'eslint';

// Create a wrapper that mimics the ESLint v8 API expected by jest-runner-eslint
export function createCompatibleESLint(options) {
  // Transform options to match ESLint v9 expectations
  const eslintOptions = {
    // Map options appropriately
    ...options
  };
  
  // Create ESLint v9 instance
  const eslint = new ESLint(eslintOptions);
  
  // Return an object with the expected API surface
  return {
    // Implement methods expected by jest-runner-eslint
    lintFiles: async (files) => await eslint.lintFiles(files),
    // Add other methods as needed
  };
}

// Export a function to patch jest-runner-eslint
export function patchJestRunnerESLint() {
  // Implementation details
}
```

### Jest Configuration Update

```javascript
// jest.config.mjs
export default {
  // ... existing configuration
  projects: [
    // ... other projects
    {
      displayName: 'lint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/src/**/*.ts'],
      moduleFileExtensions: ['ts', 'js'],
      // Add custom settings for ESLint v9 compatibility
      globals: {
        eslintUseFlatConfig: true
      }
    }
  ]
};
```

## Timeline and Milestones

1. **Research and Planning**: 1 day
   - Analyze ESLint v9 changes
   - Review jest-runner-eslint compatibility

2. **Implementation**: 2-3 days
   - Create wrapper script
   - Update configurations
   - Test integration

3. **Testing and Validation**: 1-2 days
   - Run test suite
   - Validate linting rules
   - Test pre-commit hooks

4. **Documentation and Rollout**: 1 day
   - Update documentation
   - Merge to main branch

## Conclusion

Upgrading to ESLint v9 while maintaining jest-runner-eslint integration requires careful handling of API changes. The proposed strategy provides a path forward with fallback options if compatibility issues arise. The key to success is creating a compatibility layer that bridges the gap between ESLint v9's new API and jest-runner-eslint's expectations.
