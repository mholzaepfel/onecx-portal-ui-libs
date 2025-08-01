export default {
  displayName: 'integration-tests',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/integration-tests',
  forceExit: true,
  maxConcurrency: 8,
  testTimeout: 300000, // Increased timeout for container operations
  detectOpenHandles: true, // Help detect resource leaks
}
