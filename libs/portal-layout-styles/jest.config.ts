/* eslint-disable */
export default {
  displayName: 'portal-layout-styles',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  testMatch: ['<rootDir>/src/lib/**/*.spec.ts'],
  coverageDirectory: '../../coverage/libs/portal-layout-styles',
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'text-summary', 'html'],
  testResultsProcessor: 'jest-sonar-reporter',
  reporters: [
    'default',
    [
      'jest-sonar',
      {
        outputDirectory: 'reports/portal-layout-styles',
        outputName: 'sonarqube_report.xml',
        reportedFilePath: 'absolute',
      },
    ],
    [
      'jest-junit',
      {
        outputDirectory: 'reports/portal-layout-styles',
        outputName: 'test-report.xml',
        reportedFilePath: 'absolute',
      },
    ],
  ],
}
