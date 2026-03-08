# ESLint Plugins and Rules

This document describes the ESLint plugins and rules used in the WhatsOnTV project to maintain code quality and consistency.

## Core Principles

Our ESLint configuration follows these core principles:

1. **Single Source of Truth**: ESLint is the exclusive tool for both code quality and formatting
2. **Strict Type Safety**: Leveraging TypeScript and ESLint to ensure type safety
3. **All Errors, No Warnings**: All enabled rules are set to `error` — there are no warnings
4. **Balanced Approach**: Rules are chosen to improve code without being overly restrictive

## Plugins Overview

### 1. TypeScript ESLint (`@typescript-eslint/eslint-plugin`)

Provides TypeScript-specific linting rules to ensure type safety and proper TypeScript usage.

**Key Rules:**
- `explicit-function-return-type`: Requires explicit return types on functions
- `no-explicit-any`: Disallows the `any` type
- `no-floating-promises`: Requires promises to be handled
- `strict-boolean-expressions`: Prevents implicit boolean conversions

### 2. Import Plugin (`eslint-plugin-import`)

Helps enforce proper import ordering and prevents import cycles.

**Key Rules:**
- `import/order`: Enforces a consistent import order
- `import/no-duplicates`: Prevents duplicate imports
- `import/no-cycle`: Prevents circular dependencies

### 3. Security Plugin (`eslint-plugin-security`)

Identifies potential security vulnerabilities in the code.

**Key Rules:**
- `detect-object-injection`: Warns about potential prototype pollution
- `detect-non-literal-regexp`: Identifies potential regex injection
- `detect-eval-with-expression`: Prevents dangerous eval usage
- `detect-buffer-noassert`: Prevents unsafe buffer methods
- `detect-unsafe-regex`: Identifies regexes vulnerable to ReDoS attacks

### 4. SonarJS Plugin (`eslint-plugin-sonarjs`)

Detects bugs and suspicious patterns based on static code analysis. Uses the `recommended` preset (204 rules enabled) with additional rules explicitly enabled.

**Key Rules (beyond recommended preset):**
- `no-collapsible-if`: Merge nested if statements
- `prefer-immediate-return`: Return values directly instead of assigning to variables
- `no-duplicate-string`: Identifies repeated string literals that should be constants
- `shorthand-property-grouping`: Group shorthand properties together in object literals
- `no-wildcard-import`: Prevents `export *` and `import *` patterns
- `nested-control-flow`: Limits nesting depth of control flow
- `no-inconsistent-returns`: Ensures consistent return statements
- `no-built-in-override`: Prevents overriding built-in globals

**Disabled Rules (false positives):**
- `different-types-comparison`: Flags defensive coding and generic narrowing
- `no-unused-vars`: Doesn't respect `_` prefix convention (typescript-eslint handles this)
- `no-alphabetical-sort`: Flags intentional lexicographic sort on simple strings

### 5. Promise Plugin (`eslint-plugin-promise`)

Enforces best practices for working with promises.

**Key Rules:**
- `catch-or-return`: Ensures promises are either caught or returned
- `no-return-wrap`: Prevents unnecessary promise wrapping
- `param-names`: Enforces consistent parameter names in promise callbacks
- `no-nesting`: Discourages deeply nested promise chains
- `valid-params`: Ensures proper parameters for promise methods

### 6. Unicorn Plugin (`eslint-plugin-unicorn`)

Promotes modern JavaScript patterns and practices.

**Key Rules:**
- `better-regex`: Improves regex patterns
- `error-message`: Ensures error objects have messages
- `no-array-for-each`: Encourages using `for...of` instead of `.forEach()`
- `no-for-loop`: Encourages using modern alternatives to `for` loops
- `prefer-array-find`: Encourages using `.find()` instead of `.filter()[0]`
- `prefer-includes`: Encourages using `.includes()` instead of `.indexOf() !== -1`

## Rule Severity Levels

Our configuration uses two severity levels:

1. **Error** (`error`): Must be fixed before committing code
2. **Off** (`off`): Rule is disabled (only for rules with known false positives)

### 7. Jest Plugin (`eslint-plugin-jest`)

Enforces best practices for Jest tests (test files only).

**Key Rules:**
- `jest/unbound-method`: Replaces `@typescript-eslint/unbound-method` for test files
- Recommended + style presets enabled

## Test Files Configuration

Test files have relaxed rules to allow for testing patterns that would otherwise violate the rules:

- Console usage is unrestricted
- Unsafe type operations are allowed (member access, calls, assignments, arguments, returns)
- Security plugin is not applied

## Automatic Fixing

Many rules can be automatically fixed using:

```bash
npm run lint:fix
```

## Configuration

The ESLint configuration uses ESLint v10 flat config format in `eslint.config.js`. It defines separate config blocks for source files and test files, each with appropriate rule sets and TypeScript project references.

## References

- [TypeScript ESLint](https://typescript-eslint.io/)
- [ESLint Plugin Import](https://github.com/import-js/eslint-plugin-import)
- [ESLint Plugin Security](https://github.com/eslint-community/eslint-plugin-security)
- [ESLint Plugin SonarJS](https://github.com/SonarSource/eslint-plugin-sonarjs)
- [ESLint Plugin Promise](https://github.com/eslint-community/eslint-plugin-promise)
- [ESLint Plugin Unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn)
