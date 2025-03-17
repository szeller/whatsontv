/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
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
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    }
  ]
};
