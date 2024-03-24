module.exports = {
  plugins: ['prettier', 'simple-import-sort'],
  extends: [
    'next/core-web-vitals',
    'prettier',
    'eslint:recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    '@next/next/no-img-element': 'off',
    'prettier/prettier': ['error'],
    'react/jsx-curly-brace-presence': 'warn',

    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
  },
  env: {
    browser: true,
    jest: true,
  },
}
