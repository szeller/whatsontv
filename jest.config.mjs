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
  // Always collect coverage
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  
  // Explicitly include only source files for coverage
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/tests/**/*.ts',
    '!src/**/test/*.ts'
  ],
  
  // Generate various coverage report formats
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Coverage thresholds
  coverageThreshold: {
    global: COVERAGE_THRESHOLD
  },
  
  // ESM support
  extensionsToTreatAsEsm: ['.ts'],
  
  // Automatically clear mock calls between every test
  clearMocks: true,
  
  // Projects configuration for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest/presets/default-esm',
      testMatch: ['**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.test.json' }]
      },
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^(\\.{1,2}/.*)\\.ts$': '$1'
      },
      injectGlobals: true,
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts']
    }
  ]
};

export default config;
