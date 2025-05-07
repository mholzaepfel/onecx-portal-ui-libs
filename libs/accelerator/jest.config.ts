/* eslint-disable */
import { createReportsConfig } from '../../jest.config.util'

export default {
  displayName: '@onecx/accelerator',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  ...createReportsConfig('accelerator'),
}
