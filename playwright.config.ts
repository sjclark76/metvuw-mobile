import path from 'node:path'

import { defineConfig, devices } from '@playwright/test'

// The app's pages scrape metvuw.com on the host, so tests run against a local
// stand-in (e2e/stub) instead of the live site. The app reaches it through a
// preloaded fetch shim; see e2e/stub/redirect-metvuw.mjs.
const STUB_ORIGIN = 'http://127.0.0.1:4010'
const stubbedEnv = {
  METVUW_STUB_ORIGIN: STUB_ORIGIN,
  NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --import=${path.resolve(
    __dirname,
    'e2e/stub/redirect-metvuw.mjs',
  )}`.trim(),
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  // Only the Playwright specs: e2e/stub also holds vitest unit tests (*.test.mjs).
  testMatch: '**/*.spec.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3002',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* The product is mobile-first: run the page and flow tests (tagged @mobile)
       on a phone-sized touch viewport too. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 7'] },
      grep: /@mobile/,
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Serve the production build (run `npm run build` first, through the stub:
     `node e2e/stub/with-stub.mjs npm run build`) unless a deployed URL is
     supplied. A deployed site scrapes the real metvuw.com, so no stub then. */
  webServer: process.env.PLAYWRIGHT_TEST_BASE_URL
    ? undefined
    : [
        {
          command: 'node e2e/stub/metvuw-stub.mjs',
          url: 'http://127.0.0.1:4010/health',
          reuseExistingServer: !process.env.CI,
          timeout: 30_000,
        },
        {
          command: 'npm run start',
          url: 'http://localhost:3002',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: stubbedEnv,
        },
      ],
})
