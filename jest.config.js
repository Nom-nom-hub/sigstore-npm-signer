/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  // Ignore macOS resource fork files
  testPathIgnorePatterns: ['/node_modules/', '/\\.._.*$/'],
  modulePathIgnorePatterns: ['/\\.._.*$/'],
  watchPathIgnorePatterns: ['/\\.._.*$/'],
};
