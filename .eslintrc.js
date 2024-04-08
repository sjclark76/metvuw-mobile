module.exports = {
  env: {
    browser: true,
    jest: true,
  },
  extends: [
    'next/core-web-vitals',
    'prettier',
    'eslint:recommended',
    'plugin:prettier/recommended',
  ],

  plugins: ['prettier', 'simple-import-sort'],
  rules: {
    '@next/next/no-img-element': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'prettier/prettier': ['error'],
    'react/jsx-curly-brace-presence': 'warn',
    'simple-import-sort/exports': 'error',

    'simple-import-sort/imports': 'error',
    // 'sort-keys': [
    //   'error',
    //   'asc',
    //   { caseSensitive: true, minKeys: 2, natural: false },
    // ],
  },
  ignorePatterns: ['src/shared/db/database.types.ts'],
}
