![example workflow](https://github.com/sjclark76/metvuw-mobile/actions/workflows/build-and-test.yml/badge.svg)
[![E2E Tests](https://github.com/sjclark76/metvuw-mobile/actions/workflows/playwright.yml/badge.svg)](https://github.com/sjclark76/metvuw-mobile/actions/workflows/playwright.yml)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/)
This is a [Next.js](https://nextjs.org/) weather forecast web site. View it [here](https://www.metvuwmobile.com)

## End-to-end tests

The pages scrape metvuw.com on the host, so the tests run against a local
stand-in for it (`e2e/stub`) instead of the live site: a metvuw outage or markup
change cannot fail CI. The app reaches the stub through a preloaded fetch shim
(`e2e/stub/redirect-metvuw.mjs`) that only exists in the test process.

    npm run e2e:build   # build with the stub running (the build prerenders pages)
    npm run e2e         # starts the stub and the app, then runs the tests

The region `estonia` always answers 502 from the stub, to test the error state.
Tests tagged `@mobile` also run on a phone-sized touch viewport.

Other useful runs:

    npx playwright test e2e/menu.spec.ts --project=chromium   # one spec, one browser
    npx playwright test --ui                                  # interactive UI mode

# Checkly

Deploy the latest monitoring checks:

    npx checkly deploy

# How it works

Charts are scraped from metvuw.com when a page is built or revalidated (hourly), and chart images are served through `/api/fallback-image`, which downloads them from `metvuw.com`, crops and compresses them, and caches the result. Nothing is stored on our side: there is no database, background job runner or object storage.
