[![codecov](https://codecov.io/gh/sjclark76/metvuw-mobile/branch/main/graph/badge.svg?token=KN4LGY2GFW)](https://codecov.io/gh/sjclark76/metvuw-mobile)
![example workflow](https://github.com/sjclark76/metvuw-mobile/actions/workflows/build-and-test.yml/badge.svg)
![example workflow](https://github.com/sjclark76/metvuw-mobile/actions/workflows/integration-test.yml/badge.svg)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/sjclark76/metvuw-mobile.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/sjclark76/metvuw-mobile/alerts/)
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

