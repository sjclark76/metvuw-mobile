module.exports = {
  testEnvironment: 'jsdom',
  testRegex: '(/__tests__/.*|(\\.|/)(test))\\.tsx?$',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  setupFilesAfterEnv: ['<rootDir>/importJestDOM.ts'],
  coverageThreshold: {
    global: {
      statements: 10,
      branches: 40,
      functions: 0,
      lines: 0,
    },
  },
}
