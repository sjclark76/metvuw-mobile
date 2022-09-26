module.exports = {
  testEnvironment: 'jsdom',
  testRegex: '(/__tests__/.*|(\\.|/)(test))\\.tsx?$',
  moduleNameMapper: {
    /* Handle CSS imports (with CSS modules)
    https://jestjs.io/docs/webpack#mocking-css-modules */
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',

    // Handle CSS imports (without CSS modules)
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',

    // /* Handle image imports
    // https://jestjs.io/docs/webpack#handling-static-assets */
    // '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$':
    //     '<rootDir>/__mocks__/fileMock.js',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  setupFilesAfterEnv: ['<rootDir>/importJestDOM.ts'],
  collectCoverage: true,
  collectCoverageFrom: ['./components/**', './pages/**'],
  coveragePathIgnorePatterns: ['/node_modules/', '/__snapshots__/'],
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 30,
      functions: 0,
      lines: 50,
    },
  },
}
