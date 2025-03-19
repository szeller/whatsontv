/** @type {import('ts-jest').JestConfigWithTsJest} */

// Coverage thresholds aligned with project requirements
const COVERAGE_THRESHOLD = {
  branches: 80,
  functions: 80,
  lines: 80,
  statements: 80
};

/**
 * Jest configuration for TypeScript project with ESM support
 * Version constraints:
 * - Jest v29.x.x for ESM and TypeScript compatibility
 * - ts-jest for TypeScript transformation
 */
const config = {
  // Enable coverage collection based on npm script
  collectCoverage: process.env.npm_lifecycle_event === 'coverage',
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
  
  // Enforce minimum coverage thresholds
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
    }
  ]
};

export default config;
