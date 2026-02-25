# Direct-Source Fallback Mode Plan

## Problem Statement
The current architecture depends on Inngest background scraping and Supabase Storage-hosted images. When free-tier quotas are exhausted, ingestion/storage fail and pages stop rendering. We need an environment-variable-controlled fallback mode that bypasses this pipeline and renders directly from Metvuw-hosted images.

## Objectives
1. Add a single env toggle that switches runtime behavior between:
   - **Normal mode (default):** existing Inngest + Supabase pipeline.
   - **Fallback mode:** scrape on page request and render original `metvuw.com` image URLs.
2. Keep current UI/components mostly unchanged.
3. Reuse existing scraper/parsing logic as much as possible.
4. Ensure normal mode behavior is unchanged when flag is not set.

## Proposed Env Variable
- `METVUW_DIRECT_SOURCE_MODE=true` (recommended name)

Implementation in `src/config.ts`:
- Add boolean: `directSourceMode: process.env.METVUW_DIRECT_SOURCE_MODE === 'true'`

## Target Behavior Matrix

### A) Normal mode (`METVUW_DIRECT_SOURCE_MODE` unset/false)
- No behavior changes.
- Pages read from Supabase Storage.
- Inngest cron/functions stay enabled (except existing preview behavior).
- Scrape API routes keep storage-sync behavior.

### B) Fallback mode (`METVUW_DIRECT_SOURCE_MODE=true`)
- Weather pages no longer read Supabase Storage.
- Each weather page request triggers Metvuw scraping and maps directly to chart data URLs.
- No uploads/removals to Supabase.
- Inngest handlers are disabled (serve zero functions).
- Scrape API routes are gated so they do not mutate storage.

## Architecture Changes

### 1) Introduce a mode-aware data access layer (new)
Create reusable server-side providers (new helper module), for example:
- `getRainCharts(region)`
- `getRadarCharts(radarCode)`
- `getSatelliteCharts()`
- `getUpperAirCharts(balloonCode)`

Behavior:
- **Normal mode:** current storage path + chart constructors.
- **Fallback mode:** existing screen scrapers + direct URL chart constructors.

Suggested location:
- `src/shared/helpers/v2/dataSource/` (new folder)

### 2) Reuse existing scrapers for fallback (no rewrite)
Reuse directly:
- `scrapeRainImages`
- `scrapeRadarImages`
- `scrapeSatelliteImages`
- `scrapeUpperAirImages`

Files already available:
- `src/shared/helpers/v2/screenScraper/*.ts`

### 3) Add direct-source chart constructors (new)
Current constructors assume Supabase public URLs. Add parallel constructors that consume `ScrapedImage[]` and use `originalImageURL`.

Proposed additions:
- `constructChartDataFromScrapedImages(scrapedImages)`
- `constructRainChartDataFromScrapedImages(scrapedImages)`

Reused parsing rules:
- Reuse filename timestamp parsing from existing constructors.
- Keep existing sort semantics (`imageDateUTC` ascending).

Likely location:
- `src/shared/helpers/v2/chartData/`

### 4) Wire pages to provider layer (small page edits)
Update:
- `src/app/page.tsx`
- `src/app/regions/[name]/page.tsx`
- `src/app/radar/[code]/page.tsx`
- `src/app/satellite/page.tsx`
- `src/app/upperair/[[...balloon]]/page.tsx`

Change pattern:
- Replace direct calls to `retrieveImagesFromStorage(...)` + constructor with mode-aware provider function.
- Keep page components unchanged (`RegionPage`, `RadarPage`, `SatellitePage`, `UpperAirPage`).

### 5) Gate Inngest pipeline in fallback mode
Update `src/app/api/inngest/route.ts`:
- Current: disabled only in preview.
- New: disabled when `config.directSourceMode === true` **or** preview.

Result in fallback:
- No background enqueue/upload/remove execution.

### 6) Gate scrape mutation routes in fallback mode
Update all scrape POST routes under `src/app/api/scrape/**`:
- Early branch when `config.directSourceMode` is true.
- Do not call storage upload/remove logic.
- Return an informational JSON response (`ok: true`, `mode: 'direct-source'`, optional scraped count) so health checks can still pass.

### 7) WeatherImage compatibility for external URLs
`WeatherImage` currently derives satellite/upper-air `srcSet` by replacing `images` with `small-images`, which is storage-specific.

Plan:
- Add a guarded condition so storage-specific `srcSet` rewriting runs only for storage-hosted URLs.
- In fallback mode/external URLs, render base image URL cleanly without invalid `small-images` rewrites.

File:
- `src/components/WeatherImage/WeatherImage.tsx`

## Implementation Steps (ordered)

1. **Config toggle**
   - Add `directSourceMode` in `src/config.ts`.
2. **Data-source abstraction**
   - Add provider helpers that branch by mode.
3. **Direct-source constructors**
   - Add chart mapping from `ScrapedImage` to UI chart types.
4. **Page wiring**
   - Swap page data access to providers.
5. **Inngest gating**
   - Disable served functions in fallback.
6. **Scrape route gating**
   - No-op/non-mutating behavior in fallback.
7. **Image component guard**
   - Safe handling for external Metvuw URLs.
8. **Tests + docs**
   - Add focused tests and update docs.

## Reuse Strategy (important)

Reuse without redesign:
- Existing scrape extraction and URL normalization pipeline (`screenScraper/*`).
- Existing region/radar/upper-air validation types.
- Existing page components and animation controls.
- Existing date parsing logic (extract to shared parser helpers if needed).

Avoid changing:
- UI layout/component contracts unless strictly needed.
- Existing normal-mode flow.

## Testing Plan

### Unit tests
1. `constructChartDataFromScrapedImages` parses dates and emits direct URLs correctly.
2. `constructRainChartDataFromScrapedImages` parses forecast offsets correctly.
3. Provider layer returns expected source based on mode flag.

### Route-level tests
1. In fallback mode, scrape API routes return non-mutating responses.
2. In fallback mode, `/api/inngest` serves zero functions.

### Regression checks (manual)
1. Normal mode still loads charts from Supabase URLs.
2. Fallback mode loads chart `<img src>` from `https://metvuw.com/...`.
3. All four chart families render (`rain`, `radar`, `satellite`, `upper-air`).

## Rollout Plan

1. Deploy code with fallback feature behind env flag (default off).
2. Verify normal mode in production (no behavior change).
3. When quotas are exhausted, set `METVUW_DIRECT_SOURCE_MODE=true` in Vercel and redeploy.
4. Run smoke checks on:
   - `/`
   - `/regions/nz`
   - `/radar/nl`
   - `/satellite`
   - `/upperair/93112`
5. After quotas recover, unset the env variable to return to normal mode.

## Risks and Mitigations

1. **Higher request-time latency in fallback**
   - Mitigation: keep pages dynamic but consider optional short TTL cache as a follow-up.
2. **Metvuw HTML structure drift**
   - Mitigation: continue reusing centralized selectors in scrapers so fixes are isolated.
3. **External URL rendering quirks**
   - Mitigation: guard storage-specific `srcSet` logic in `WeatherImage`.
4. **Accidental writes to Supabase in fallback**
   - Mitigation: explicit early return in scrape routes + Inngest function disable.

## SQL Todo Mapping

Mapped implementation todos (already seeded):
- `add-fallback-config-flag`
- `create-direct-source-data-layer`
- `wire-pages-to-mode-switch`
- `gate-background-pipeline`
- `add-fallback-tests`
- `document-fallback-operations`
