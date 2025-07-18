// tests/jest.config.csv.js
module.exports = {
  displayName: 'Data-Driven CSV Tests',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: [
    '<rootDir>/data-driven/**/*.test.js',
    '<rootDir>/unit/**/*.csv.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/cypress/'
  ],
  coverageDirectory: '<rootDir>/reports/coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/cypress/'
  ],
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './reports',
        filename: 'csv-test-report.html',
        pageTitle: 'Data-Driven Test Report',
        expand: true
      }
    ]
  ],
  testTimeout: 30000
};