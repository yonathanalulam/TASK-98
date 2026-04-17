/**
 * Integration test config — real HTTP against a running backend.
 * Requires docker-compose up (or `docker compose up --build`) first.
 */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration_tests'],
  testMatch: ['**/*.integration.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 60_000,
  verbose: true,
  collectCoverage: false
};
