/* eslint-disable */
export default {
  displayName: '@onecx/accelerator',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  testMatch: ['<rootDir>/src/lib/**/*.spec.ts'],
  coverageDirectory: './reports/coverage',
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'text-summary', 'html'],
  testResultsProcessor: 'jest-sonar-reporter',
  reporters: [
    'default',
    [
      'jest-sonar',
      {
        outputDirectory: '<rootDir>/reports',
        outputName: 'test_report.xml',
        reportedFilePath: 'absolute',
      },
    ],
  ],
}
