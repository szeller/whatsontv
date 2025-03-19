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

1. ✅ Run the test suite to verify ESLint integration works
2. ✅ Validate that all linting rules continue to function correctly
3. ✅ Fix strict-boolean-expressions warnings:
   - Updated functions to use explicit null/undefined checks
   - Fixed `normalizeShowData`, `applyShowFilters`, `normalizeNetworkName`, `groupShowsByNetwork`, and `fetchTvShows`
   - Added proper type checking to avoid implicit conversions
4. ✅ Fix formatting issues:
   - Addressed line length violations (max-len rule)
   - Fixed indentation issues
   - Added 'void' operator to prevent no-floating-promises warnings
5. ✅ Ensure pre-commit hooks work properly
6. ✅ Update CI pipeline to work with new ESLint configuration
7. ✅ Update project documentation to reflect ESLint v9 upgrade

### Phase 4: Final Integration

1. ✅ Restore strict-boolean-expressions and no-floating-promises rules to error level
2. ✅ Add test:changed script to package.json for pre-commit hooks
3. ✅ Update .lintstagedrc.js to use the new script instead of duplicating the command
4. ✅ Verify CI pipeline works correctly with all ESLint v9 changes
5. ✅ Update TechSpec.md and README.md with new ESLint v9 information

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
5. **Fixed Code Issues**: Addressed multiple strict-boolean-expressions warnings by using explicit null/undefined checks
   - Updated `normalizeShowData`, `applyShowFilters`, `normalizeNetworkName`, `groupShowsByNetwork`, and `fetchTvShows` functions
   - Fixed line length violations to comply with the 100 character limit
   - Added 'void' operator to prevent no-floating-promises warnings

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

5. **Code Quality Improvements**: The upgrade process identified and fixed several code quality issues:
   - Explicit null/undefined checks for better type safety
   - Proper promise handling to prevent floating promises
   - Consistent formatting and line length compliance

This approach aligns with the project's standards for a single source of truth for code quality and formatting while reducing the overall complexity of the toolchain.

## Future Considerations

1. **Monitor TypeScript ESLint Plugin Updates**: Watch for official updates that add explicit ESLint v9 support
2. **Evaluate Performance**: Compare the performance of direct ESLint execution with the previous Jest-based approach
3. **Consider ESLint Plugins**: Evaluate additional ESLint plugins that may enhance the linting capabilities
4. **Re-evaluate Integration Options**: If unified test/lint reporting becomes a priority, explore alternative integration methods
5. **Optimize Pre-commit Hooks**: Continue to refine the pre-commit hook experience to balance code quality with developer productivity
6. **Maintain Documentation**: Keep documentation updated as ESLint and related tools evolve

## Completion Status

The ESLint v9 upgrade has been successfully completed with the following achievements:

1. **Full ESLint v9 Integration**: Upgraded to ESLint v9.0.0 with flat config format
2. **TypeScript ESLint v7 Integration**: Successfully integrated with @typescript-eslint/eslint-plugin v7.0.0
3. **Simplified Toolchain**: Removed jest-runner-eslint dependency and streamlined the linting process
4. **Code Quality Improvements**: Fixed all strict-boolean-expressions and no-floating-promises warnings
5. **Pre-commit Hook Optimization**: Improved pre-commit hooks by disabling coverage checks and adding a dedicated test:changed script
6. **CI Pipeline Verification**: Confirmed that the CI pipeline works correctly with the new ESLint configuration
7. **Documentation Updates**: Updated README.md and TechSpec.md to reflect the ESLint v9 upgrade

All planned tasks have been completed, and the codebase now fully complies with the project's code quality standards using ESLint v9.
