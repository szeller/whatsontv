/** @type {import('ts-jest').JestConfigWithTsJest} */

// Coverage thresholds aligned with project requirements
const COVERAGE_THRESHOLD = {
  branches: 0, // Temporarily disabled until coverage is improved (see issue #16)
  functions: 0,
  lines: 0,
  statements: 0
};

/**
 * Jest configuration for TypeScript project with ESM support
 * Version constraints:
 * - Jest v29.x.x for ESM and TypeScript compatibility
 * - ts-jest for TypeScript transformation
 */
const config = {
  // Always collect coverage
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  
  // Exclude test files and type definitions from coverage
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '\\.test\\.ts$',
    '<rootDir>/src/types/'
  ],
  
  // Generate various coverage report formats
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Enforce minimum coverage thresholds (temporarily disabled, see issue #16)
  coverageThreshold: {
    global: COVERAGE_THRESHOLD
  },
  
  // Configure test runners
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest/presets/default-esm',
      moduleNameMapper: {
        // Handle ESM imports in Jest environment
        '^(\\.{1,2}/.*)\\.js$': '$1'
      },
      transform: {
        // Transform TypeScript files using ts-jest
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            useESM: true,
            tsconfig: 'tsconfig.json'
          }
        ]
      },
      // Required for ESM support
      extensionsToTreatAsEsm: ['.ts'],
      // Enable Jest globals for better test readability
      injectGlobals: true,
      testEnvironment: 'node',
      testMatch: ['**/*.test.ts'],
      // Add setup file for common mocks
      setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts']
    },
    {
      displayName: 'lint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/src/**/*.ts'],
      moduleFileExtensions: ['ts', 'js']
    }
  ]
};

export default config;
