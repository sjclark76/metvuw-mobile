# Metvuw Mobile: Deep Technical Research

## 1) What this project is

Metvuw Mobile is a Next.js App Router application that:

1. Scrapes weather chart images from metvuw.com.
2. Compresses/transforms those images to WebP.
3. Syncs them into Supabase Storage.
4. Serves chart pages optimized for mobile users (rain, radar, satellite, upper-air).

Core technologies in active use:
- Next.js 16 + React 19 (`package.json`)
- Inngest for scheduled/background orchestration (`src/app/api/inngest/route.ts`, `src/inngest/**`)
- Supabase Storage via service-role client (`src/shared/db/serviceRoleDb.ts`)
- Sharp-based image compression (`src/shared/helpers/v2/imageCompression/**`)
- Playwright/Vitest/Checkly for testing and monitoring (`playwright.config.ts`, `vitest.config.ts`, `__checks__/**`)

---

## 2) High-level architecture

### 2.1 Runtime shape

- **Frontend/UI:** Next.js App Router pages in `src/app/**`.
- **Scraping API:** Next route handlers under `src/app/api/scrape/**`.
- **Background scheduler/executor:** Inngest endpoint + functions under `src/app/api/inngest/route.ts` and `src/inngest/**`.
- **Data/storage layer:** Supabase Storage (not relational DB tables at runtime).
- **Transformation layer:** Screen scraping + path normalization + compression in `src/shared/helpers/v2/**`.

### 2.2 Primary source-of-truth

Operationally, chart availability is driven by **objects in Supabase Storage paths**, not by persisted SQL metadata tables.

---

## 3) End-to-end data flow

## 3.1 Scrape extraction

Image extraction starts in `loadImages()`:
- Fetches source HTML with axios.
- Parses it with cheerio.
- Extracts `img` `src` values by selector.
(`src/shared/helpers/v2/screenScraper/loadImages.ts`)

Then `imagePipeline()` converts each relative URL into:
- `originalImageURL`
- `originalFileName`
- normalized `.webp` `imageFileName`
- canonical storage paths (`fullStoragePath`, optional `smallImageStoragePath`)
(`src/shared/helpers/v2/screenScraper/imagePipeline.ts`)

Chart-specific scrapers:
- Rain: `scrapeRainImages()` (`forecast/forecast.php?...`, selector `img[src*=rain]`)
- Radar: `scrapeRadarImages()` (`radar/radar.php?location=nz`, selector `img[src*=images]`)
- Satellite: `scrapeSatelliteImages()` (`satellite`, selector `img[src*=small]`)
- Upper air: `scrapeUpperAirImages()` (`upperair`, selector `img[src$="thumb.png"]`)
(`src/shared/helpers/v2/screenScraper/*.ts`)

### 3.2 Delta calculation

Sync is delta-based:
- `calculateImagesToDownload(newImages, existingImages)`
- `calculateImagesToRemove(newImages, existingImages)`

Both compare only `fullStoragePath`.
(`src/shared/helpers/v2/imageStorage/determineImagesToAdd.ts`)

### 3.3 Download, compression, upload

For each image to upload:
1. Download bytes from source URL (`downloadImageToBuffer`).
2. Select compressor by chart type (`getCompressorForChart`).
3. Compress primary image and optionally small variant.
4. Upload WebP to Storage with `cacheControl: 31536000`, `upsert: false`.

Key files:
- `src/shared/helpers/v2/imageStorage/downloadAndUpload.ts`
- `src/shared/helpers/v2/imageStorage/downloadImageToBuffer.ts`
- `src/shared/helpers/v2/imageStorage/uploadImagesToStorage.ts`
- `src/shared/helpers/v2/imageCompression/getCompressorForChart.ts`

Compression specifics:
- Rain: quality 40 + crop (`compressRainImage.ts`)
- Radar: quality 100 + sharpen + resize width 565 (`compressRadarImage.ts`)
- Satellite: quality 20 + crop, plus optional small resize (`compressSatelliteImage.ts`)
- Upper air: quality 30, optional small resize (`compressUpperAirImage.ts`)

### 3.4 Deletion flow

Images no longer present upstream are deleted in batch by path:
- `removeImagesFromStorage(bucket, toRemove)`
(`src/shared/helpers/v2/imageStorage/removeImagesFromStorage.ts`)

### 3.5 Read path for UI

Pages read from Storage recursively via:
- `retrieveImagesFromStorage(path)`

This function also creates the bucket if missing.
(`src/shared/helpers/v2/imageStorage/retrieveImagesFromStorage.ts`)

Then chart view models are derived:
- Generic: `constructChartData`
- Rain-specific: `constructRainChartData` (adds forecast offset semantics)
(`src/shared/helpers/v2/chartData/*.ts`)

---

## 4) API surface

Active scrape endpoints (all **POST** handlers):

- `POST /api/scrape/radar`  
  `src/app/api/scrape/radar/route.ts`
- `POST /api/scrape/satellite`  
  `src/app/api/scrape/satellite/route.ts`
- `POST /api/scrape/upper-air`  
  `src/app/api/scrape/upper-air/route.ts`
- `POST /api/scrape/regions/[name]` (full region sync)  
  `src/app/api/scrape/regions/[name]/route.ts`
- `POST /api/scrape/regions/upload/[name]` (upload-only delta)  
  `src/app/api/scrape/regions/upload/[name]/route.ts`
- `POST /api/scrape/regions/remove/[name]` (remove-only delta)  
  `src/app/api/scrape/regions/remove/[name]/route.ts`

Each route follows the same operational motif:
scrape -> list existing -> compute delta -> mutate storage -> return summary JSON.

---

## 5) Inngest orchestration model

### 5.1 Endpoint wiring

`src/app/api/inngest/route.ts` serves all Inngest functions, but disables them in preview:
- If `config.environment === 'preview'`, `functions = []`.

### 5.2 Typed events

Inngest event schema (`src/inngest/client.ts`):
- `scrape/region`
- `images/upload`
- `images/remove`

### 5.3 Cron schedule

`defaultPollerTime`:
- production-like: every 6 hours (`0 */6 * * *`)
- preview: effectively never (`59 23 31 12 * 1970`)
(`src/inngest/cronFunctions/pollingCronSchedule.ts`)

### 5.4 Pollers and workers

- `rainPoller`: fans out one `scrape/region` event per region.
- `radarPoller` / `satellitePoller` / `upperAirPoller`: do scrape+diff, then dispatch upload/remove events.
- `scrapeRegion` function: region scrape worker invoked by `scrape/region`.
- `uploadImages` and `removeImages`: mutation workers for storage operations.

Files:
- `src/inngest/cronFunctions/*.ts`
- `src/inngest/functions/*.ts`

---

## 6) Frontend architecture and UX flow

### 6.1 Route model

Pages:
- `/` -> default NZ rain page (`src/app/page.tsx`)
- `/regions/[name]` -> region rain charts (`src/app/regions/[name]/page.tsx`)
- `/radar/[code]` -> radar charts (`src/app/radar/[code]/page.tsx`)
- `/satellite` -> satellite charts (`src/app/satellite/page.tsx`)
- `/upperair/[[...balloon]]` -> upper-air charts (`src/app/upperair/[[...balloon]]/page.tsx`)

All major weather pages use `export const dynamic = 'force-dynamic'` to avoid static staleness.

### 6.2 Shared layout and navigation

`src/app/layout.tsx`:
- wraps app in Jotai `<Provider>`
- includes sticky `Navbar`
- runs `FavoritePageRedirect` (redirect `/` to user-selected page)
- includes `GoogleTag` analytics and `react-hot-toast` toaster

`src/components/Navbar/NavBar.tsx` builds region/radar/upper-air menus from typed region maps.

### 6.3 State model (Jotai)

Global UI state atoms (`src/components/Atoms/GlobalState.ts`):
- `isMenuOpenAtom`
- `playAnimationAtom`
- `displayAnimatedChartAtom`
- `animatedChartIndexAtom`
- `favoritePageAtom` (localStorage-backed via `atomWithStorage`)

Rain image load progress state:
- `loadedImageStateAtom` (`src/app/regions/[name]/state.ts`)
- consumed by `SubHeader` for top progress bar (`src/components/SubHeader/SubHeader.tsx`)

### 6.4 Rendering/animation strategy

- Rain charts: `WeatherChartsWithAnimation` + `AnimatedWeatherChart` + `FooterControl`.
- Radar/satellite/upper-air: `RadarAndSatelliteImages` + animated/static card variants.
- `FooterControl` toggles animation mode, play/pause, slider index, and step controls.
- Preloading hook pre-warms browser cache with `new Image().src = url`.

Files:
- `src/components/WeatherCharts/WeatherChartsWithAnimation.tsx`
- `src/components/AnimatedWeatherChart/animated-weather-chart.tsx`
- `src/components/RadarAndSatelliteImages/*.tsx`
- `src/components/FooterControl/index.tsx`
- `src/components/Hooks/usePreloadedImages.ts`
- `src/shared/helpers/images.ts`

### 6.5 Image delivery behavior

`WeatherImage` builds responsive `srcSet` for Satellite and Upper Air by swapping `images/` -> `small-images/` and sets chart-specific dimensions.  
(`src/components/WeatherImage/WeatherImage.tsx`)

---

## 7) Configuration, PWA, observability

### 7.1 Runtime config

`src/config.ts` centralizes env-backed config:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET_NAME`
- `INNGEST_EVENT_KEY`
- `VERCEL_ENV`

### 7.2 PWA/offline

- Service worker source: `src/app/sw.ts`
- Built via Serwist (`next.config.ts` `withSerwist`)
- Offline fallback route: `/offline` (`src/app/offline/page.tsx`)
- Manifest: `public/manifest.json`

`next.config.ts` also disables image optimization (`images.unoptimized = true`) and sets global `Cache-Control: no-store`.

### 7.3 Observability

- Google Analytics via `GoogleTag` (`src/components/GoogleTag/GoogleTag.tsx`)
- Baselime OpenTelemetry bootstrap in `instrumentation.ts`

---

## 8) Testing and delivery pipeline

### 8.1 Test setup

- Unit/component tests run with Vitest (`npm test`, `vitest.config.ts`)
- Jest config also exists (`jest.config.mjs`) but is not the default package script target.
- E2E tests in `e2e/**` via Playwright (`playwright.config.ts`)

### 8.2 CI workflows

- Build & Test: `.github/workflows/build-and-test.yml`
- Playwright against Vercel preview: `.github/workflows/playwright.yml`
- CodeQL scan: `.github/workflows/codeql-analysis.yml`

### 8.3 Synthetic checks

Checkly config exists (`checkly.config.ts`) and checks live in `__checks__/**`.

---

## 9) Data and schema notes

- `src/shared/db/database.types.ts` includes generated types for old tables (`images_to_upload`, `images_to_remove`, `trigger`).
- Supabase migrations include creation then removal of these tables (`supabase/migrations/*`), indicating architecture shifted away from queue tables.
- Current runtime code path is storage-object based sync with Inngest events rather than SQL row queues.

---

## 10) Notable inconsistencies and drift (important for future work)

1. **Vercel cron points to a missing route**  
   `vercel.json` references `/api/cache/refresh`, but no `src/app/api/cache/**` route exists.

2. **API method/path drift in monitoring/tests**  
   Active scrape routes are `POST /api/scrape/...`, while several Checkly/E2E API checks target old `GET` paths (e.g. `/api/scrape/rain/...`) and are skipped.

3. **Mixed test stack**  
   Both Jest and Vitest config are present; active npm script uses Vitest.

4. **Legacy custom server artifact**  
   `server.js` exists with a port/log mismatch (`listen(3000)` but logs `3001`), suggesting legacy or non-primary runtime path.

---

## 11) Practical runbook (from current code)

- Local dev app: `npm run dev` (port 3002)
- Build: `npm run build`
- Unit tests: `npm test`
- E2E tests: `npx playwright test` (uses `PLAYWRIGHT_TEST_BASE_URL` if set)
- Inngest dev: `npm run inggest:dev`
- Manual scrape all endpoints: `scripts/scrape-all.sh`

---

## 12) Key files to read first (fast orientation)

1. `src/app/api/inngest/route.ts`
2. `src/inngest/cronFunctions/*.ts`
3. `src/inngest/functions/*.ts`
4. `src/shared/helpers/v2/screenScraper/*.ts`
5. `src/shared/helpers/v2/imageStorage/*.ts`
6. `src/app/{page.tsx,regions/[name]/page.tsx,radar/[code]/page.tsx,satellite/page.tsx,upperair/[[...balloon]]/page.tsx}`
7. `src/components/{RegionPage,RadarAndSatelliteImages,WeatherCharts,FooterControl,Navbar}/**/*.tsx`
8. `next.config.ts` and `src/app/sw.ts`

---

## Conclusion

This project is a storage-centric weather image synchronization and presentation system: scrape and normalize upstream assets, apply deterministic transforms, sync deltas to Supabase Storage, then render dynamic weather pages with lightweight animation controls.  
The current architecture is coherent around that pipeline, with the main maintenance risk being drift in older operational artifacts (legacy checks/routes/types) versus the active POST + Inngest + storage workflow.
