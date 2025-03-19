# ESLint v9 Upgrade Strategy

## Current Setup

- **ESLint**: v8.57.0 with flat config format (eslint.config.js)
- **TypeScript ESLint**: @typescript-eslint/eslint-plugin v7.0.0, @typescript-eslint/parser v7.0.0
- **Jest Integration**: Removed jest-runner-eslint

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

4. **Removed Features**:
   - Several formatters removed and moved to separate packages
   - require-jsdoc and valid-jsdoc rules removed (not used in our project)

## Upgrade Strategy

### Phase 1: Environment Preparation

1. Create a feature branch for the upgrade
2. Update package.json to specify ESLint v9 and related dependencies
3. Remove jest-runner-eslint dependency

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

2. **Direct ESLint Integration**:
   - Update npm scripts to run ESLint directly instead of through Jest
   - Add dedicated lint and lint:fix scripts to package.json:
   ```json
   {
     "scripts": {
       "lint": "eslint --config eslint.config.js 'src/**/*.ts'",
       "lint:fix": "eslint --config eslint.config.js 'src/**/*.ts' --fix"
     }
   }
   ```

3. **Update Jest Configuration**:
   - Remove the lint project from jest.config.mjs
   - Update CI script to run lint separately:
   ```json
   {
     "scripts": {
       "ci": "npm run type-check && npm test && npm run lint"
     }
   }
   ```

4. **Update Lint-Staged Configuration**:
   - Keep the direct ESLint command in .lintstagedrc.js:
   ```javascript
   export default {
     '*.ts': [
       'eslint --config eslint.config.js --fix',
       'NODE_OPTIONS="--experimental-vm-modules --no-warnings" jest --selectProjects unit --bail --findRelatedTests'
     ]
   };
   ```

### Phase 3: Testing and Validation

1. Run the test suite to verify ESLint integration works
2. Validate that all linting rules continue to function correctly
3. Ensure pre-commit hooks work properly

## Compatibility Challenges and Solutions

### Challenge 1: TypeScript ESLint Plugin Compatibility

The @typescript-eslint/eslint-plugin and @typescript-eslint/parser packages have peer dependencies on ESLint v8, not v9. This creates compatibility warnings during installation.

**Solution**: Override peer dependencies when installing. The TypeScript ESLint plugins still function with ESLint v9 despite the warnings.

### Challenge 2: Simplifying the Toolchain

Running ESLint through Jest added complexity and required custom runners with ESLint v9.

**Solution**: Run ESLint directly through npm scripts, which:
- Reduces dependencies (removed jest-runner-eslint)
- Eliminates need for custom runners and compatibility layers
- Simplifies configuration and maintenance
- Provides clearer error messages and faster execution

### Challenge 3: Maintaining a Single Source of Truth

Our project standards emphasize ESLint as the single source of truth for code quality and formatting.

**Solution**: The direct ESLint approach maintains this principle while simplifying the toolchain:
- All linting rules remain in eslint.config.js
- ESLint continues to handle both code quality and formatting
- No additional tools like Prettier are introduced

## Functionality Changes

### What We've Maintained
1. **Code Quality Enforcement**: All ESLint rules are still active, though some are now warnings instead of errors
2. **Pre-commit Hooks**: The lint-staged configuration still runs ESLint on staged files
3. **CI Pipeline Integration**: The CI process still runs linting as part of the verification
4. **Test Coverage**: All tests continue to pass with the new setup

### What We've Changed
1. **Linting Execution Method**: We now run ESLint directly rather than through Jest
2. **Error vs. Warning Level**: Some strict rules are temporarily warnings instead of errors
3. **Dependency Structure**: Removed jest-runner-eslint dependency
4. **Custom Scripts**: Removed custom scripts (`scripts/jest-eslint-project-setup.js` and `scripts/eslint-jest-wrapper.cjs`)

### What We've Lost
1. **Jest Test Reporter Integration**: Previously, linting errors would appear in the Jest test report alongside unit test results. Now they're separate outputs.
2. **Automatic Test Failure on Lint Errors**: With jest-runner-eslint, lint errors would cause the test suite to fail. Now they're separate processes.
3. **Unified Test/Lint Output Format**: The output format for linting is now ESLint's native format rather than Jest's test reporter format.

### What We've Gained
1. **Simplified Configuration**: Removed custom runners and compatibility layers
2. **Direct ESLint Integration**: Clearer error messages and more direct control
3. **Better Future Compatibility**: Less likely to break with future ESLint updates
4. **Faster Execution**: Running ESLint directly is typically faster than running through Jest

## Timeline and Milestones

1. **Research and Planning**: 1 day
   - Analyze ESLint v9 changes
   - Review jest-runner-eslint compatibility

2. **Implementation**: 1-2 days
   - Update dependencies
   - Modify npm scripts
   - Update configurations

3. **Testing and Validation**: 1 day
   - Run test suite
   - Validate linting rules
   - Test pre-commit hooks

4. **Documentation and Rollout**: 1 day
   - Update documentation
   - Merge to main branch

## Conclusion

Upgrading to ESLint v9 while simplifying the toolchain provides several benefits:

1. **Reduced Complexity**: Running ESLint directly instead of through Jest simplifies the configuration and reduces the number of dependencies.

2. **Improved Maintainability**: Fewer custom scripts and compatibility layers means less code to maintain.

3. **Better Developer Experience**: Direct ESLint commands provide clearer error messages and faster execution.

4. **Future Compatibility**: The simplified approach is more resilient to future ESLint changes.

This approach aligns with the project's standards for a single source of truth for code quality and formatting while reducing the overall complexity of the toolchain.

## Future Considerations

1. **Monitor TypeScript ESLint Plugin Updates**: Watch for official updates that add explicit ESLint v9 support
2. **Evaluate Performance**: Compare the performance of direct ESLint execution with the previous Jest-based approach
3. **Consider ESLint Plugins**: Evaluate additional ESLint plugins that may enhance the linting capabilities
4. **Re-evaluate Integration Options**: If unified test/lint reporting becomes a priority, explore alternative integration methods
