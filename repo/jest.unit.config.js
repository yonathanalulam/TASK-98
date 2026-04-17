module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/unit_tests'],
  testMatch: ['**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Coverage instrumentation — produces line, branch, function, and statement
  // metrics alongside lcov + json-summary artifacts for CI consumption.
  //
  // Controlled at invocation time: `npm run test:unit` keeps fast feedback,
  // `npm run test:coverage[:unit]` enables collection and threshold gating.
  collectCoverage: false,
  coverageDirectory: '<rootDir>/coverage/unit',
  coverageProvider: 'v8',
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary', 'html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.module.ts',
    '!src/**/*.dto.ts',
    '!src/**/entities/**',
    '!src/database/migrations/**',
    '!src/main.ts',
    '!src/scripts/**'
  ],
  // Start with realistic thresholds (current unit suite does not exercise controllers
  // directly; integration/API suites do). Raise as the mock-heavy gaps shrink.
  coverageThreshold: {
    global: {
      lines: 25,
      branches: 20,
      functions: 25,
      statements: 25
    }
  },
  verbose: true
};
