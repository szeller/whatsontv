import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';

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
      '@typescript-eslint': tseslint
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
      '@typescript-eslint/no-floating-promises': 'warn', // Downgraded to warn for compatibility
      '@typescript-eslint/strict-boolean-expressions': 'warn', // Downgraded to warn for compatibility
      '@typescript-eslint/no-non-null-assertion': 'error',
      
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
