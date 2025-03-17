import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  eslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    ignores: ['**/dist/**', '**/node_modules/**'],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
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
      'prettier': prettierPlugin
    },
    rules: {
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
      'prettier/prettier': ['error', {
        semi: true,
        trailingComma: 'none',
        singleQuote: true,
        printWidth: 100,
        tabWidth: 2,
        arrowParens: 'avoid'
      }]
    }
  },
  prettierConfig
];
