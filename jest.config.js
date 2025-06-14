module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'scripts/**/*.js',
    '!scripts/watch.js', // 排除监听脚本
    '!**/node_modules/**'
  ],
  verbose: true,
  testTimeout: 10000
}; 