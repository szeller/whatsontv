# TypeScript Path Aliases: Recommendations & Path Forward

## Assessment of Current Situation

After reviewing our path aliases implementation attempts, I believe there is still value in pursuing this feature, but with a more sustainable approach that aligns with our development standards.

## Value Proposition

Implementing path aliases would bring several benefits to the WhatsOnTV codebase:

1. **Code Clarity**: Aliases like `@interfaces/` and `@implementations/` make the intent and source of imports immediately clear
2. **Refactoring Resilience**: Moving files requires fewer import path updates when using aliases
3. **Consistency**: Enforces a standardized import pattern across the codebase
4. **Reduced "../../" Chains**: Eliminates hard-to-track relative import paths

## Recommended Approach

Based on our project structure and the ESM module system we're using, I recommend the following approach:

### Option 1: Use esbuild-node-loader (Preferred)

This approach maintains our on-the-fly execution model while properly supporting path aliases:

```bash
npm install --save-dev @esbuild-kit/esm-loader
```

1. **Configuration Updates**:
   - Keep the path aliases in `tsconfig.json` 
   - Update package.json scripts to use the loader:

```json
"scripts": {
  "start": "node --loader @esbuild-kit/esm-loader src/cli.ts",
  "test": "NODE_OPTIONS=\"--loader @esbuild-kit/esm-loader\" jest"
}
```

**Benefits**:
- Much faster execution than ts-node
- Proper support for both TypeScript and ESM features
- Handles path aliases correctly
- No separate build step needed

### Option 2: Add a Build Step

If the esbuild loader approach doesn't work well enough, we could implement a proper build step:

1. **Add Build Packages**:
```bash
npm install --save-dev tsc-alias concurrently nodemon
```

2. **Setup Build Process**:
```json
"scripts": {
  "build": "tsc && tsc-alias",
  "dev": "concurrently \"tsc --watch\" \"tsc-alias --watch\"",
  "start": "npm run build && node dist/cli.js"
}
```

**Benefits**:
- Works reliably across all environments
- Clear separation between source and build artifacts
- IDE-friendly development experience

## Implementation Plan

If we decide to proceed, I recommend the following phased approach:

### Phase 1: Setup & Configuration
1. Implement the esbuild-kit loader approach
2. Update tsconfig.json with appropriate path aliases
3. Configure Jest to work with the new setup
4. Create a proof-of-concept branch with a few imports using aliases

### Phase 2: Incremental Migration
1. Set standards for which imports should use aliases (e.g., only cross-directory imports)
2. Update one module at a time to use path aliases
3. Run comprehensive tests after each module migration

### Phase 3: Finalization
1. Add linting rules to enforce consistent import patterns
2. Update documentation with the new import conventions
3. Train team members on the new approach

## Integration with Existing Architecture

This approach integrates well with our clean architecture principles by:

1. Reinforcing the separation between interfaces and implementations
2. Making architectural boundaries more visible through import paths
3. Supporting our unidirectional dependency flow

## Conclusion

Path aliases are worth implementing if we use modern tools designed for ESM TypeScript projects. The esbuild-kit loader approach offers the best balance between development experience and reliability, while maintaining our on-the-fly execution model.

If we encounter issues with the loader approach, then moving to a proper build step would be the more reliable alternative, though it would change our development workflow.

The decision to proceed should be based on team capacity for this refactoring work versus other feature priorities, but I believe the long-term maintenance benefits are substantial.
