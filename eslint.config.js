import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import securityPlugin from 'eslint-plugin-security';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import promisePlugin from 'eslint-plugin-promise';
import unicornPlugin from 'eslint-plugin-unicorn';
import jestPlugin from 'eslint-plugin-jest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * ESLint v9 configuration with TypeScript-ESLint v8.x
 *
 * This configuration maintains compatibility with the project's formatting standards:
 * - Single quotes, semicolons required, no trailing commas, 2-space indent, 100 char width
 * - Strict type system with explicit function return types
 * - No floating promises or non-null assertions
 *
 * Enhanced with additional plugins for:
 * - Security (eslint-plugin-security)
 * - Code quality (eslint-plugin-sonarjs)
 * - Promise handling (eslint-plugin-promise)
 * - Modern JavaScript practices (eslint-plugin-unicorn)
 * - TypeScript type checking (integrated with ESLint)
 * - Jest testing (eslint-plugin-jest)
 */

// ── Shared rule groups ─────────────────────────────────────────────────────────

// Formatting and code-quality rules (non-TypeScript)
const baseRules = {
  // Import rules
  'import/no-unresolved': 'off', // TypeScript handles this
  'import/order': 'off',
  'import/no-duplicates': 'error',
  'import/no-cycle': 'error',

  // Formatting rules (aligned with project standards)
  'semi': ['error', 'always'],
  'quotes': ['error', 'single'],
  'max-len': ['error', { 'code': 100 }],
  'indent': ['error', 2],
  'comma-dangle': ['error', 'never'],
  'object-curly-spacing': ['error', 'always'],
  'array-bracket-spacing': ['error', 'never'],

  // Code quality rules
  'eqeqeq': 'error',
  'no-var': 'error',
  'prefer-const': 'error',
  'no-loss-of-precision': 'error'
};

// TypeScript rules: strict-type-checked + stylistic-type-checked presets,
// plus custom additions not covered by any preset.
// The presets provide ~89 rules; we override 4 with custom options and add 8 more.
const tsRules = {
  // Preset: strict-type-checked (68 TS rules + base ESLint overrides)
  // Includes recommended + strict + type-checked rules
  ...tseslint.configs['strict-type-checked'].rules,

  // Preset: stylistic-type-checked (21 TS rules)
  // Includes stylistic + type-checked stylistic rules
  ...tseslint.configs['stylistic-type-checked'].rules,

  // ── Custom overrides (preset default is too strict for numbers) ──
  '@typescript-eslint/restrict-template-expressions': ['error', {
    allowNumber: true
  }],

  // ── Custom overrides (options differ from preset defaults) ──
  '@typescript-eslint/explicit-function-return-type': ['error', {
    allowExpressions: true,
    allowTypedFunctionExpressions: true
  }],
  '@typescript-eslint/no-unused-vars': ['error', {
    argsIgnorePattern: '^_',
    varsIgnorePattern: '^_',
    caughtErrorsIgnorePattern: '^_'
  }],
  '@typescript-eslint/ban-ts-comment': ['error', {
    'ts-expect-error': 'allow-with-description'
  }],
  '@typescript-eslint/no-extraneous-class': ['error', {
    allowStaticOnly: true
  }],

  // ── Additional rules not in any preset ──
  // Disabled: flags valid patterns like loadFixture<T>(): T and post<T, D>()
  '@typescript-eslint/no-unnecessary-type-parameters': 'off',
  '@typescript-eslint/strict-boolean-expressions': 'error',
  '@typescript-eslint/consistent-return': 'error',
  '@typescript-eslint/switch-exhaustiveness-check': 'error',
  '@typescript-eslint/require-array-sort-compare': 'error',
  '@typescript-eslint/strict-void-return': 'error',
  '@typescript-eslint/prefer-readonly': 'error',
  '@typescript-eslint/consistent-type-exports': 'error',
  '@typescript-eslint/promise-function-async': 'error'
};

// SonarJS overrides: rules disabled because they overlap with other plugins
// or are deferred for future refactoring (shared between source and test configs)
const disabledSonarjsRules = {
  // Overlap with typescript-eslint
  'sonarjs/no-array-delete': 'off',           // @typescript-eslint/no-array-delete
  'sonarjs/deprecation': 'off',               // @typescript-eslint/no-deprecated
  'sonarjs/no-unused-vars': 'off',            // @typescript-eslint/no-unused-vars
  'sonarjs/prefer-regexp-exec': 'off',        // @typescript-eslint/prefer-regexp-exec
  'sonarjs/no-alphabetical-sort': 'off',      // @typescript-eslint/require-array-sort-compare
  'sonarjs/unused-import': 'off',             // @typescript-eslint/no-unused-vars
  // Overlap with eslint built-in
  'sonarjs/no-useless-catch': 'off',          // eslint no-useless-catch
  'sonarjs/no-fallthrough': 'off',            // eslint no-fallthrough
  'sonarjs/different-types-comparison': 'off', // eqeqeq
  'sonarjs/no-delete-var': 'off',             // eslint no-delete-var
  'sonarjs/no-control-regex': 'off',          // eslint no-control-regex
  'sonarjs/no-empty-character-class': 'off',  // eslint no-empty-character-class
  'sonarjs/no-invalid-regexp': 'off',         // eslint no-invalid-regexp
  'sonarjs/no-regex-spaces': 'off',           // eslint no-regex-spaces
  // Covered by TypeScript compiler
  'sonarjs/no-extra-arguments': 'off',
  'sonarjs/argument-type': 'off',
  'sonarjs/in-operator-type-error': 'off',
  'sonarjs/no-literal-call': 'off',
  // Deferred: violations need manual refactoring
  'sonarjs/cognitive-complexity': 'off',
  'sonarjs/no-identical-functions': 'off',
  'sonarjs/no-ignored-exceptions': 'off',
  'sonarjs/use-type-alias': 'off',
  // Deferred: project conventions
  'sonarjs/no-nested-conditional': 'off',
  'sonarjs/todo-tag': 'off',
  'sonarjs/fixme-tag': 'off'
};

// Unicorn rules (curated subset — full recommended is too aggressive)
const unicornRules = {
  // Error prevention
  'unicorn/error-message': 'error',
  'unicorn/throw-new-error': 'error',
  'unicorn/no-useless-undefined': 'error',
  'unicorn/no-useless-promise-resolve-reject': 'error',
  'unicorn/no-useless-length-check': 'error',
  'unicorn/no-useless-spread': 'error',
  'unicorn/no-unnecessary-await': 'error',
  'unicorn/no-object-as-default-parameter': 'error',
  'unicorn/no-abusive-eslint-disable': 'error',

  // Modern JS preferences
  'unicorn/prefer-node-protocol': 'error',
  'unicorn/prefer-number-properties': 'error',
  'unicorn/prefer-string-slice': 'error',
  'unicorn/prefer-string-replace-all': 'error',
  'unicorn/prefer-at': 'error',
  'unicorn/prefer-array-find': 'error',
  'unicorn/prefer-array-flat-map': 'error',
  'unicorn/prefer-date-now': 'error',
  'unicorn/prefer-set-has': 'error',
  'unicorn/prefer-spread': 'error',
  'unicorn/prefer-regexp-test': 'error',
  'unicorn/prefer-negative-index': 'error',
  'unicorn/prefer-type-error': 'error',
  'unicorn/prefer-ternary': 'error',
  'unicorn/prefer-optional-catch-binding': 'error',
  'unicorn/prefer-structured-clone': 'error',
  'unicorn/prefer-switch': 'error',
  'unicorn/prefer-top-level-await': 'error',

  // Code clarity
  'unicorn/catch-error-name': 'error',
  'unicorn/no-nested-ternary': 'error',
  'unicorn/no-lonely-if': 'error',
  'unicorn/no-for-loop': 'error',
  'unicorn/no-zero-fractions': 'error',
  'unicorn/no-array-push-push': 'error',
  'unicorn/no-typeof-undefined': 'error',
  'unicorn/no-await-expression-member': 'error',
  'unicorn/consistent-function-scoping': 'error',
  'unicorn/better-regex': 'error',

  // Disabled — conflicts with project patterns
  'unicorn/no-null': 'off',              // Conflicts with Zod nullable() patterns
  'unicorn/prevent-abbreviations': 'off' // Too aggressive for our codebase
};

// ── Config array ────────────────────────────────────────────────────────────────

export default [
  // Global ignores
  {
    ignores: ['dist/**', 'cdk.out/**', 'node_modules/**', 'coverage/**']
  },
  eslint.configs.recommended,
  // Main source files configuration
  {
    files: ['src/**/*.ts'],
    ignores: [
      '**/dist/**', '**/node_modules/**', '**/coverage/**',
      'src/**/*.test.ts', 'src/tests/**/*.ts'
    ],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: path.dirname(fileURLToPath(import.meta.url))
      },
      globals: {
        process: 'readonly',
        console: 'readonly',
        global: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'import': importPlugin,
      'security': securityPlugin,
      'sonarjs': sonarjsPlugin,
      'promise': promisePlugin,
      'unicorn': unicornPlugin
    },
    rules: {
      ...baseRules,
      ...tsRules,

      // Security: recommended preset (all warn) + escalate key rules to error
      ...securityPlugin.configs.recommended.rules,
      'security/detect-eval-with-expression': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-new-buffer': 'error',
      'security/detect-object-injection': 'off', // Too many false positives in TS

      // SonarJS: recommended preset + disabled overlaps/deferred
      ...sonarjsPlugin.configs.recommended.rules,
      ...disabledSonarjsRules,

      // Promise: recommended preset + escalate warn rules to error
      ...promisePlugin.configs['flat/recommended'].rules,
      'promise/always-return': 'error',
      'promise/no-return-in-finally': 'error',
      'promise/no-nesting': 'error',
      'promise/no-promise-in-callback': 'error',
      'promise/no-callback-in-promise': 'error',
      'promise/valid-params': 'error',

      // Unicorn: curated subset
      ...unicornRules,

      // Console rules
      'no-console': ['error', { allow: ['warn', 'error'] }]
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error'
    }
  },
  // Test files configuration
  {
    files: ['src/**/*.test.ts', 'src/tests/**/*.ts'],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.test.json',
        tsconfigRootDir: path.dirname(fileURLToPath(import.meta.url))
      },
      globals: {
        process: 'readonly',
        console: 'readonly',
        global: 'readonly',
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'import': importPlugin,
      'jest': jestPlugin,
      'sonarjs': sonarjsPlugin
    },
    rules: {
      ...baseRules,
      ...tsRules,

      // Disable TypeScript's unbound-method rule in favor of Jest's version
      '@typescript-eslint/unbound-method': 'off',
      'jest/unbound-method': 'error',

      // SonarJS: recommended preset + disabled overlaps/deferred
      ...sonarjsPlugin.configs.recommended.rules,
      ...disabledSonarjsRules,
      // Test-specific sonarjs rules
      'sonarjs/no-exclusive-tests': 'error',
      'sonarjs/no-skipped-tests': 'warn',

      // Relax rules for test files
      'no-console': 'off',
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      // Tests use mocks, type assertions, and loose typing extensively
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off'
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error'
    }
  }
];
