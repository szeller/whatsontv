/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
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
        '^.+\\.tsx?$': ['ts-jest', {
          useESM: true,
        }]
      },
      extensionsToTreatAsEsm: ['.ts']
    },
    {
      displayName: 'lint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/src/**/*.ts'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx']
    }
  ]
};

if (process.env.npm_lifecycle_event === 'coverage') {
  config.projects[0] = {
    ...config.projects[0],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coveragePathIgnorePatterns: [
      '/node_modules/',
      '/dist/',
      '\\.test\\.ts$',
      '/types/'
    ],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  };
}

export default config;
