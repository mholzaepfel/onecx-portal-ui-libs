/* eslint-disable */
export default {
  displayName: 'accelerator',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  testMatch: ['<rootDir>/src/lib/**/*.spec.ts'],
  coverageDirectory: '../../coverage/libs/accelerator',
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'text-summary', 'html'],
  testResultsProcessor: 'jest-sonar-reporter',
  reporters: [
    'default',
    [
      'jest-sonar',
      {
        outputDirectory: 'reports/accelerator',
        outputName: 'sonarqube_report.xml',
        reportedFilePath: 'absolute',
      },
    ],
    [
      'jest-junit',
      {
        outputDirectory: 'reports/accelerator',
        outputName: 'test-report.xml',
        reportedFilePath: 'absolute',
      },
    ],
  ],
}
