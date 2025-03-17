/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  collectCoverage: process.env.npm_lifecycle_event === 'coverage',
  coverageDirectory: '<rootDir>/coverage',
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '\\.test\\.ts$',
    '<rootDir>/src/types/'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  projects: [
    {
      displayName: 'test',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['**/*.test.ts'],
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { useESM: true }]
      },
      extensionsToTreatAsEsm: ['.ts'],
      injectGlobals: true
    },
    {
      displayName: 'lint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/src/**/*.ts'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx']
    }
  ]
};

export default config;
