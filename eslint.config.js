import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

/**
 * ESLint v9 configuration
 * 
 * This configuration maintains compatibility with the project's formatting standards:
 * - Single quotes, semicolons required, no trailing commas, 2-space indent, 100 char width
 * - Strict type system with explicit function return types
 * - No floating promises or non-null assertions
 */
export default [
  eslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: ['./tsconfig.json', './tsconfig.test.json'],
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
      'import': importPlugin
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
      '@typescript-eslint/no-floating-promises': 'error', // Restored to error level
      '@typescript-eslint/strict-boolean-expressions': 'error', // Restored to error level
      '@typescript-eslint/no-non-null-assertion': 'error',
      
      // Import rules
      'import/no-unresolved': 'off', // TypeScript handles this
      'import/order': ['error', {
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always',
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        }
      }],
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
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'eqeqeq': 'error',
      'no-unused-expressions': 'error',
      'no-var': 'error',
      'prefer-const': 'error'
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error'
    }
  },
  // Test-specific overrides
  {
    files: ['**/*.test.ts', '**/tests/**/*.ts'],
    rules: {
      // Relax certain rules for tests
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off'
    }
  }
];
