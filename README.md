[![codecov](https://codecov.io/gh/sjclark76/metvuw-mobile/branch/main/graph/badge.svg?token=KN4LGY2GFW)](https://codecov.io/gh/sjclark76/metvuw-mobile)
![example workflow](https://github.com/sjclark76/metvuw-mobile/actions/workflows/build-and-test.yml/badge.svg)
[![E2E Tests](https://github.com/sjclark76/metvuw-mobile/actions/workflows/playwright.yml/badge.svg)](https://github.com/sjclark76/metvuw-mobile/actions/workflows/playwright.yml)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/)
This is a [Next.js](https://nextjs.org/) weather forecast web site. View it [here](https://www.metvuwmobile.com)

npx playwright test
Runs the end-to-end tests.

npx playwright test --ui
Starts the interactive UI mode.

npx playwright test --project=chromium
Runs the tests only on Desktop Chrome.

npx playwright test example
Runs the tests in a specific file.

npx playwright test --debug
Runs the tests in debug mode.

npx playwright codegen
Auto generate tests with Codegen.

We suggest that you begin by typing:

    npx playwright test


# supabase

## Migrations

### Create New Migration
``` bash
supabase migration new MIGRATION_NAME
```

### Deploy Migration

```
supabase db push
```

### Create Auto Migration

supabase db diff -f MIGRATION_NAME



# Checkly

deploy latest tests
`npx checkly deploy`


# Inngest

run dev server
`npx inngest-cli@latest dev`

# Docker
colima start                                                                                          

