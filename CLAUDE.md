# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See also `AGENTS.md`: this is a recent Next.js with breaking changes, so read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code.

## What this is

A mobile-friendly Next.js (App Router, React 19, Tailwind) front end for the NZ weather charts published by metvuw.com. Node 24.x.

## Commands

- `npm run dev`: dev server on port 3002
- `npm run build`: production build (`next build --webpack`); `npm run prod` cleans, builds and starts
- `npm run lint` / `npm run lint:fix`: CI runs lint with `--max-warnings 0`
- `npx vitest run`: all unit tests (plain `npm test` watches)
- `npx vitest run src/path/to/file.test.ts`: a single test file; add `-t "name"` for one test
- `npm run e2e:build` then `npm run e2e`: Playwright tests (see below)
- `npx playwright test e2e/menu.spec.ts --project=chromium`: a single e2e spec
- `npm run places:build`, `npm run chart-geometry:measure|verify`: regenerate or check generated data files (`scripts/`)

## Architecture

- **No database or backend of our own.** Pages scrape metvuw.com at build time and revalidate hourly. Chart images are proxied through `/api/fallback-image`, which downloads, crops, compresses and caches them. Other routes: `/api/chart-list`, `/api/scrape`, `/api/warm` (the `warm-cache.yml` workflow hits it).
- **Layout:** routes in `src/app` (regions, radar, satellite, upper air, pins, saved, settings, offline). UI in `src/components`, one folder per feature. Non-UI logic in `src/shared/helpers` (chart data, geometry, image download/compression, offline, pins, places, rain bands, heavy rain).
- **`src/proxy.ts`** (Next's middleware successor) redirects `/` to the visitor's favourite page via cookie, and sets country-based cookies from `x-vercel-ip-country`. `src/securityHeaders.ts` and `src/config.ts` hold headers and shared config.
- **PWA / offline:** the service worker is `src/app/sw.ts` (Serwist), with `swChartImages` and `swSavedPages` handling cached charts and saved pages. Keep offline behaviour in mind when changing image or page loading.
- **State:** jotai. Tests sit next to the code (`*.test.ts(x)`); vitest runs in jsdom with the `@` alias to `src`.

## Testing against metvuw

E2E tests never hit the live site. `e2e/stub` is a local stand-in for metvuw.com, and a preloaded fetch shim (`e2e/stub/redirect-metvuw.mjs`, injected via `NODE_OPTIONS`) redirects the app to it. The build prerenders pages, so build with the stub running (`npm run e2e:build`). The region `estonia` always answers 502 to test the error state. Tests tagged `@mobile` also run on a phone-sized touch viewport. Vitest also runs unit tests in `e2e/stub/**/*.test.mjs` and `scripts/**/*.test.mjs`.

## CI

`build-and-test.yml` runs lint, build and vitest. `playwright.yml` runs the e2e suite. Checkly monitors production (`npm run checkly:test`, `checkly:deploy`).

## Design docs

Specs and plans for larger features live in `docs/superpowers/specs` and `docs/superpowers/plans`.
