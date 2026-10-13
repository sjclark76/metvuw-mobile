import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'

export default defineConfig([
  globalIgnores(['src/shared/db/database.types.ts']),
  js.configs.recommended,
  ...nextCoreWebVitals,
  prettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.vitest,
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      '@next/next/no-img-element': 'off',
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'prettier/prettier': ['error'],
      'react/jsx-curly-brace-presence': 'warn',
      'simple-import-sort/exports': 'error',
      'no-unused-vars': 'warn',
      'simple-import-sort/imports': 'error',
    },
  },
  {
    files: ['src/app/sw.ts'],
    languageOptions: { globals: globals.serviceworker },
  },
  {
    files: ['public/sw.js', 'src/app/layout.tsx'],
    rules: { 'no-console': 'off' },
  },
])
