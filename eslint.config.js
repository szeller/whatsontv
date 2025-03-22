import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import securityPlugin from 'eslint-plugin-security';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import promisePlugin from 'eslint-plugin-promise';
import unicornPlugin from 'eslint-plugin-unicorn';

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
 */
export default [
  eslint.configs.recommended,
  // Main source files configuration
  {
    files: ['src/**/*.ts'],
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', 'src/**/*.test.ts', 'src/tests/**/*.ts'],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: '.'
      },
      globals: {
        // Node.js globals
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
      // TypeScript-specific rules
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true
      }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/ban-ts-comment': ['error', { 
        'ts-expect-error': 'allow-with-description' 
      }], // Replaces prefer-ts-expect-error
      '@typescript-eslint/no-require-imports': 'error', // Replaces no-var-requires
      
      // Import rules
      'import/no-unresolved': 'off', // TypeScript handles this
      'import/order': ['warn', {
        'groups': [
          ['builtin', 'external'],
          ['internal', 'parent', 'sibling', 'index']
        ],
        'newlines-between': 'always',
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        }
      }],
      'import/no-duplicates': 'error',
      'import/no-cycle': 'error',
      
      // Security rules
      'security/detect-object-injection': 'off', // Relaxed due to common patterns in the codebase
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-eval-with-expression': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-unsafe-regex': 'warn',
      'security/detect-new-buffer': 'error',
      
      // SonarJS rules for code quality
      'sonarjs/no-identical-expressions': 'error',
      'sonarjs/no-identical-conditions': 'error',
      'sonarjs/no-inverted-boolean-check': 'warn',
      'sonarjs/no-redundant-boolean': 'warn',
      'sonarjs/no-unused-collection': 'warn',
      'sonarjs/no-use-of-empty-return-value': 'error',
      'sonarjs/no-duplicate-string': ['warn', { 'threshold': 3 }],
      'sonarjs/prefer-immediate-return': 'warn',
      'sonarjs/prefer-object-literal': 'warn',
      'sonarjs/prefer-single-boolean-return': 'warn',
      'sonarjs/no-small-switch': 'warn',
      'sonarjs/no-gratuitous-expressions': 'error',
      
      // Promise handling rules
      'promise/catch-or-return': 'error',
      'promise/no-return-wrap': 'error',
      'promise/param-names': 'error',
      'promise/no-nesting': 'warn',
      'promise/no-promise-in-callback': 'warn',
      'promise/no-callback-in-promise': 'warn',
      'promise/avoid-new': 'warn',
      'promise/no-new-statics': 'error',
      'promise/valid-params': 'error',
      
      // Unicorn rules for modern JavaScript practices
      'unicorn/better-regex': 'warn',
      'unicorn/catch-error-name': 'warn',
      'unicorn/consistent-destructuring': 'warn',
      'unicorn/error-message': 'error',
      'unicorn/no-array-for-each': 'warn',
      'unicorn/no-for-loop': 'warn',
      'unicorn/no-lonely-if': 'warn',
      'unicorn/no-nested-ternary': 'warn',
      'unicorn/no-null': 'off', // Conflicts with TypeScript patterns
      'unicorn/no-useless-undefined': 'warn',
      'unicorn/prefer-array-find': 'warn',
      'unicorn/prefer-array-flat-map': 'warn',
      'unicorn/prefer-includes': 'warn',
      'unicorn/prefer-string-slice': 'warn',
      'unicorn/prefer-ternary': 'warn',
      'unicorn/prevent-abbreviations': 'off', // Too aggressive for our codebase
      
      // Formatting rules (aligned with project standards)
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'max-len': ['error', { 'code': 100 }],
      'indent': ['error', 2],
      'comma-dangle': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      
      // Code quality rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'eqeqeq': 'error',
      'no-unused-expressions': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-loss-of-precision': 'error' // Using base rule instead of @typescript-eslint version
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
        tsconfigRootDir: '.'
      },
      globals: {
        // Node.js globals
        process: 'readonly',
        console: 'readonly',
        global: 'readonly',
        // Jest globals
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly'
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
      // TypeScript-specific rules
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true
      }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'off', // Relaxed for tests
      '@typescript-eslint/no-non-null-assertion': 'off', // Relaxed for tests
      '@typescript-eslint/ban-ts-comment': ['error', { 
        'ts-expect-error': 'allow-with-description' 
      }],
      '@typescript-eslint/no-require-imports': 'error',
      
      // Import rules - simplified for test files
      'import/no-unresolved': 'off',
      'import/order': 'off', // Disable import order for test files
      'import/no-duplicates': 'error',
      'import/no-cycle': 'error',
      
      // Security rules - relaxed for test files
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-regexp': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-eval-with-expression': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-unsafe-regex': 'off',
      'security/detect-new-buffer': 'error',
      
      // SonarJS rules - relaxed for test files
      'sonarjs/no-identical-expressions': 'error',
      'sonarjs/no-identical-conditions': 'error',
      'sonarjs/no-inverted-boolean-check': 'warn',
      'sonarjs/no-redundant-boolean': 'warn',
      'sonarjs/no-unused-collection': 'off',
      'sonarjs/no-use-of-empty-return-value': 'error',
      'sonarjs/no-duplicate-string': 'off', // Tests often have duplicate strings
      'sonarjs/prefer-immediate-return': 'off',
      'sonarjs/prefer-object-literal': 'off',
      'sonarjs/prefer-single-boolean-return': 'off',
      'sonarjs/no-small-switch': 'off',
      'sonarjs/no-gratuitous-expressions': 'error',
      
      // Promise handling rules - relaxed for test files
      'promise/catch-or-return': 'warn',
      'promise/no-return-wrap': 'warn',
      'promise/param-names': 'error',
      'promise/no-nesting': 'off',
      'promise/no-promise-in-callback': 'off',
      'promise/no-callback-in-promise': 'off',
      'promise/avoid-new': 'off',
      'promise/no-new-statics': 'error',
      'promise/valid-params': 'error',
      
      // Unicorn rules - relaxed for test files
      'unicorn/better-regex': 'warn',
      'unicorn/catch-error-name': 'off',
      'unicorn/consistent-destructuring': 'off',
      'unicorn/error-message': 'warn',
      'unicorn/no-array-for-each': 'off',
      'unicorn/no-for-loop': 'off',
      'unicorn/no-lonely-if': 'off',
      'unicorn/no-nested-ternary': 'off',
      'unicorn/no-null': 'off',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/prefer-array-find': 'off',
      'unicorn/prefer-array-flat-map': 'off',
      'unicorn/prefer-includes': 'warn',
      'unicorn/prefer-string-slice': 'warn',
      'unicorn/prefer-ternary': 'off',
      'unicorn/prevent-abbreviations': 'off',
      
      // Formatting rules
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'max-len': ['error', { 'code': 100 }],
      'indent': ['error', 2],
      'comma-dangle': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      
      // Code quality rules - relaxed for test files
      'no-console': 'off',
      'eqeqeq': 'error',
      'no-unused-expressions': 'off', // Allow unused expressions in tests (for chai etc.)
      'no-var': 'error',
      'prefer-const': 'error',
      'no-loss-of-precision': 'error'
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error'
    }
  }
];
