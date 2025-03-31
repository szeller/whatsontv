import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import securityPlugin from 'eslint-plugin-security';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import promisePlugin from 'eslint-plugin-promise';
import unicornPlugin from 'eslint-plugin-unicorn';
import jestPlugin from 'eslint-plugin-jest';

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

// Common TypeScript rules for both source and test files
const commonTsRules = {
  // TypeScript-specific rules
  ...tseslint.configs.recommended.rules,
  
  // Override some strict rules for our codebase
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
  '@typescript-eslint/no-require-imports': 'error',
  
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
  'no-unused-expressions': 'error',
  'no-var': 'error',
  'prefer-const': 'error',
  'no-loss-of-precision': 'error'
};

// Strict type-checking rules for source files
const strictTypeRules = {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/strict-boolean-expressions': 'error',
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-misused-promises': 'error',
  '@typescript-eslint/unbound-method': 'error',
  '@typescript-eslint/no-unnecessary-type-assertion': 'error',
  '@typescript-eslint/no-unnecessary-type-arguments': 'error',
  '@typescript-eslint/restrict-plus-operands': 'error',
  '@typescript-eslint/restrict-template-expressions': 'error',
};

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
      ...commonTsRules,
      ...strictTypeRules,
      
      // Rules with many violations temporarily disabled - to be fixed in GitHub issue #49
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      
      // Strict type checking rules - previously warnings, now errors
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/only-throw-error': 'error',
      
      // Security rules (selected subset)
      'security/detect-eval-with-expression': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-new-buffer': 'error',
      
      // SonarJS rules (selected subset)
      'sonarjs/no-identical-expressions': 'error',
      'sonarjs/no-identical-conditions': 'error',
      'sonarjs/no-use-of-empty-return-value': 'error',
      'sonarjs/no-gratuitous-expressions': 'error',
      
      // Promise handling rules (selected subset)
      'promise/catch-or-return': 'error',
      'promise/no-return-wrap': 'error',
      'promise/param-names': 'error',
      'promise/no-new-statics': 'error',
      
      // Unicorn rules (selected subset)
      'unicorn/error-message': 'error',
      'unicorn/no-null': 'off', // Conflicts with TypeScript patterns
      'unicorn/prevent-abbreviations': 'off', // Too aggressive for our codebase
      
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
        tsconfigRootDir: '.'
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
      'jest': jestPlugin
    },
    rules: {
      ...commonTsRules,
      ...strictTypeRules,
      
      // Disable TypeScript's unbound-method rule in favor of Jest's version
      '@typescript-eslint/unbound-method': 'off',
      'jest/unbound-method': 'error',
      
      // Only relax these specific rules for tests
      'no-console': 'off',
      'no-unused-expressions': 'off' // Allow unused expressions in tests (for chai etc.)
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error'
    }
  }
];
