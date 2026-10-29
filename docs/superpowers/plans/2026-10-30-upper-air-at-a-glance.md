# Upper air at a glance: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Each upper air station page shows an "At a glance" summary of the latest weather balloon sounding, and our own simple chart in place of metvuw's tephigram when metvuw's is older.

**Architecture:** Server only. A fetcher gets the newest sounding with data from the University of Wyoming (cached for an hour with the page). Pure functions parse it and turn it into plain-language lines. Two server components render the panel (text) and our chart (inline SVG). The page passes the sounding to `UpperAirPage`, which picks our chart or metvuw's.

**Tech Stack:** Next.js 16 App Router (server components, `fetch` with `next.revalidate`), React 19, TypeScript, Tailwind CSS 4, Vitest + Testing Library, Playwright with the e2e stub.

**Spec:** `docs/superpowers/specs/2026-10-30-upper-air-at-a-glance-design.md`

## Global constraints

- Wyoming URL: `https://weather.uwyo.edu/wsgi/sounding?` + `URLSearchParams({ datetime: 'YYYY-MM-DD HH:00:00', id: <station>, src: 'UNKNOWN', type: 'TEXT:LIST' })`. Launches are 00 and 12 UTC.
- Wyoming answers: 200 with rows → use; 200 with no rows or 400 → step back one launch; 503, any other status, an error or a timeout → stop (`undefined`). Never retry. At most 4 launches. 10 s timeout per request. `next: { revalidate: 3600 }`.
- "Low-complete": the lowest reading is at or below 500 m.
- Copy, exactly: "At a glance"; "Freezing level N m"; " · snow possible down to about N m"; "Freezing at ground level"; "Cloud A – B m" (layers joined by ", "); "Dry: no cloud layers" (with a gap: "Dry above N m: no cloud layers"); "Inversion near the ground: fog, haze or smog can be trapped"; "Wind W 33 kt at 1 km · …"; "N °C at 3,000 m"; "Unstable: thunderstorms possible"; "Stable: thunderstorms unlikely"; "No readings below N m from this balloon"; source line "From Friday 1:00am's balloon · University of Wyoming data. What the balloon measured, not a forecast."
- Heights in copy are rounded to 100 m (freezing level to 10 m), with thousands separators ("1,500"). Negative temperatures use the minus sign "−".
- Times are New Zealand time: `formatInTimeZone(time, format, DEFAULT_TIME_ZONE)` from `@/shared/helpers/timeZone`.
- No new client JavaScript: the new components have no `'use client'`.
- Code style: Prettier via `npx eslint --fix <paths>`; single quotes, no semicolons, comments that say why.

## File map

| File | Status | Responsibility |
|---|---|---|
| `src/shared/helpers/sounding/fixtures/invercargill-2026102912.html` | create | Real complete sounding (test data) |
| `src/shared/helpers/sounding/fixtures/whenuapai-2026102800.html` | create | Real sounding missing its lowest 1,468 m (test data) |
| `src/shared/helpers/sounding/parseSounding.ts` (+ `.test.ts`) | create | Wyoming page text → levels and indices |
| `src/shared/helpers/sounding/summariseSounding.ts` (+ `.test.ts`) | create | Levels → the facts the panel shows |
| `src/shared/helpers/sounding/fetchSounding.ts` (+ `.test.ts`) | create | Newest launch with data, from Wyoming |
| `src/shared/helpers/sounding/showOwnChart.ts` (+ `.test.ts`) | create | Our chart or metvuw's |
| `src/components/UpperAirPage/SoundingGlance.tsx` (+ `.test.tsx`) | create | The "At a glance" panel |
| `src/components/UpperAirPage/SoundingChart.tsx` (+ `.test.tsx`) | create | Our chart, as SVG |
| `src/components/UpperAirPage/UpperAirPage.tsx` | modify | Shows the panel; chooses the chart |
| `src/app/upperair/[[...balloon]]/page.tsx` | modify | Fetches the sounding alongside metvuw's charts |
| `e2e/stub/redirect-metvuw.mjs` (+ `.test.mjs`) | modify | Also sends `weather.uwyo.edu` to the stub |
| `e2e/stub/metvuw-stub.mjs` | modify | Answers `/wsgi/sounding` from the fixtures |
| `e2e/upper-air-sounding.spec.ts` | create | The three station cases, end to end |
| `e2e/accessibility.spec.ts` | modify | Scans the page with our chart |

---

### Task 1: Parse a Wyoming sounding

**Files:**
- Create: `src/shared/helpers/sounding/fixtures/invercargill-2026102912.html`, `src/shared/helpers/sounding/fixtures/whenuapai-2026102800.html`
- Create: `src/shared/helpers/sounding/parseSounding.ts`
- Test: `src/shared/helpers/sounding/parseSounding.test.ts`

**Interfaces:**
- Produces: `SoundingLevel`, `Sounding`, `parseSounding(page: string): Sounding` (exported from `@/shared/helpers/sounding/parseSounding`).

- [ ] **Step 1: Save the two real soundings as fixtures**

Wyoming rate-limits, so fetch them a few seconds apart. Each must contain the table header; a 40-byte "too busy" page means try again in a minute.

```bash
mkdir -p src/shared/helpers/sounding/fixtures
curl -s -o src/shared/helpers/sounding/fixtures/invercargill-2026102912.html 'https://weather.uwyo.edu/wsgi/sounding?datetime=2026-10-29+12%3A00%3A00&id=93844&src=UNKNOWN&type=TEXT%3ALIST'
sleep 10
curl -s -o src/shared/helpers/sounding/fixtures/whenuapai-2026102800.html 'https://weather.uwyo.edu/wsgi/sounding?datetime=2026-10-28+00%3A00%3A00&id=93112&src=UNKNOWN&type=TEXT%3ALIST'
grep -c 'PRES   HGHT' src/shared/helpers/sounding/fixtures/*.html
```

Expected: each file reports `1`, and the files are roughly 300 KB (Invercargill) and 90 KB (Whenuapai). If a file is 40 bytes, wait a minute and fetch it again.

- [ ] **Step 2: Write the failing test**

`src/shared/helpers/sounding/parseSounding.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { parseSounding } from './parseSounding'

const fixture = (name: string) =>
  readFileSync(join(__dirname, 'fixtures', name), 'utf8')

describe('parseSounding', () => {
  test('reads every level of a complete sounding, from the ground up', () => {
    const { levels } = parseSounding(fixture('invercargill-2026102912.html'))

    expect(levels).toHaveLength(3777)
    expect(levels[0]).toEqual({
      pressureHpa: 995.7,
      heightM: 2,
      tempC: 7.3,
      dewPointC: 2.4,
      windFromDeg: 260,
      windKt: 16,
    })
  })

  test('reads the indices under the table', () => {
    const { liftedIndex, cape } = parseSounding(
      fixture('invercargill-2026102912.html'),
    )

    expect(liftedIndex).toBe(2.7)
    expect(cape).toBe(75.4)
  })

  test('starts where the readings start, when the lowest are missing', () => {
    const { levels } = parseSounding(fixture('whenuapai-2026102800.html'))

    expect(levels).toHaveLength(1093)
    expect(levels[0].heightM).toBe(1468)
  })

  test('finds no levels in a page with no table', () => {
    expect(
      parseSounding('The server is too busy, try again later.'),
    ).toEqual({ levels: [], liftedIndex: undefined, cape: undefined })
  })

  // Wyoming's rows have all eleven values (checked on 48 soundings); a row cut
  // short is skipped rather than read into the wrong columns.
  test('skips a row cut short, and carries on', () => {
    const page = `
   PRES   HGHT   TEMP   DWPT   RELH   MIXR   DRCT   SPED   THTA   THTE   THTV
    hPa      m      C      C      %   g/kg    deg    m/s      K      K      K
 1000.0     10   15.0   10.0     72   7.80    180    5.0  288.1  310.2  289.5
  990.0    100   14.0    9.5
  980.0    190   13.0    9.0     76   7.50    190    6.0  288.9  310.6  290.2
`
    expect(parseSounding(page).levels.map((l) => l.heightM)).toEqual([10, 190])
  })
})
```

- [ ] **Step 3: Run it to see it fail**

Run: `npx vitest run src/shared/helpers/sounding/parseSounding.test.ts`
Expected: FAIL, "Failed to resolve import ./parseSounding".

- [ ] **Step 4: Write the parser**

`src/shared/helpers/sounding/parseSounding.ts`:

```ts
/** One level of a weather balloon's sounding. */
export interface SoundingLevel {
  pressureHpa: number
  /** Metres above sea level. */
  heightM: number
  tempC: number
  dewPointC: number
  /** Where the wind blows from, in degrees. */
  windFromDeg: number
  windKt: number
}

export interface Sounding {
  /** From the lowest reading up. Empty when the page has no table. */
  levels: SoundingLevel[]
  liftedIndex?: number
  /** Most unstable CAPE, in J/kg. */
  cape?: number
}

const KNOTS_PER_METRE_PER_SECOND = 1.94384

/**
 * The levels and indices in a University of Wyoming sounding page (its
 * TEXT:LIST form): a fixed-width table, `PRES HGHT TEMP DWPT RELH MIXR DRCT
 * SPED ...`, with the indices in a table below it. Its rows have every value; a
 * row with fewer than eight is skipped. The table ends at the first blank line.
 */
export function parseSounding(page: string): Sounding {
  const text = page.replace(/<[^>]*>/g, ' ')
  const lines = text.split('\n')
  const header = lines.findIndex((line) =>
    /^\s*PRES\s+HGHT\s+TEMP\s+DWPT/.test(line),
  )

  const levels: SoundingLevel[] = []
  if (header >= 0) {
    for (const line of lines.slice(header + 1)) {
      if (levels.length > 0 && line.trim() === '') break
      const values = line.trim().split(/\s+/).map(Number)
      if (values.length < 8 || !values.slice(0, 8).every(Number.isFinite)) {
        continue
      }
      const [pressureHpa, heightM, tempC, dewPointC, , , windFromDeg, speed] =
        values
      levels.push({
        pressureHpa,
        heightM,
        tempC,
        dewPointC,
        windFromDeg,
        windKt: Math.round(speed * KNOTS_PER_METRE_PER_SECOND),
      })
    }
  }

  const index = (label: string) => {
    const match = text.match(new RegExp(`${label}\\s+(-?\\d+(?:\\.\\d+)?)`))
    return match ? Number(match[1]) : undefined
  }

  return {
    levels,
    liftedIndex: index('Virtual Lifted Index'),
    cape: index('Most Unstable CAPE'),
  }
}
```

- [ ] **Step 5: Run the tests to see them pass**

Run: `npx vitest run src/shared/helpers/sounding/parseSounding.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 6: Lint and commit**

```bash
npx eslint --fix src/shared/helpers/sounding
git add src/shared/helpers/sounding
git commit -m "feat: read a weather balloon sounding from the University of Wyoming's page"
```

---

### Task 2: Summarise a sounding

**Files:**
- Create: `src/shared/helpers/sounding/summariseSounding.ts`
- Test: `src/shared/helpers/sounding/summariseSounding.test.ts`

**Interfaces:**
- Consumes: `Sounding`, `SoundingLevel`, `parseSounding` (Task 1).
- Produces: `SoundingSummary`, `CloudLayer`, `WindAt`, `Freezing`, `summariseSounding(sounding: Sounding): SoundingSummary`, `nearestLevel(levels: SoundingLevel[], heightM: number): SoundingLevel | undefined`, `compassPoint(degrees: number): string`.

- [ ] **Step 1: Write the failing test**

`src/shared/helpers/sounding/summariseSounding.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { parseSounding, type SoundingLevel } from './parseSounding'
import { summariseSounding } from './summariseSounding'

const fromFixture = (name: string) =>
  summariseSounding(
    parseSounding(readFileSync(join(__dirname, 'fixtures', name), 'utf8')),
  )

const level = (heightM: number, tempC: number, dewPointC = tempC - 10) =>
  ({
    pressureHpa: 1000,
    heightM,
    tempC,
    dewPointC,
    windFromDeg: 270,
    windKt: 20,
  }) satisfies SoundingLevel

const summarise = (levels: SoundingLevel[], indices = {}) =>
  summariseSounding({ levels, liftedIndex: 3, cape: 0, ...indices })

describe('summariseSounding', () => {
  describe('a complete sounding (Invercargill, 30 Oct 2026, 1am)', () => {
    const summary = fromFixture('invercargill-2026102912.html')

    test('has no gap', () => {
      expect(summary.gapBelowM).toBeUndefined()
    })

    test('finds the freezing level, and the snow level 300 m below it', () => {
      expect(summary.freezing).toEqual({ kind: 'height', m: 970 })
      expect(summary.snowLevelM).toBe(700)
    })

    test('finds the cloud layers, lowest first', () => {
      expect(summary.cloud).toEqual([
        { fromM: 581, toM: 918 },
        { fromM: 1071, toM: 1433 },
      ])
    })

    test('gives the wind at 1, 3 and 5 km', () => {
      expect(summary.winds).toEqual([
        { atKm: 1, compass: 'W', kt: 33 },
        { atKm: 3, compass: 'W', kt: 47 },
        { atKm: 5, compass: 'SW', kt: 56 },
      ])
    })

    test('gives the temperature at 3 km, and says the air is stable', () => {
      expect(summary.tempAt3kmC).toBe(-14)
      expect(summary.stability).toBe('stable')
      expect(summary.inversion).toBe(false)
    })
  })

  describe('a sounding missing its lowest readings (Whenuapai, 28 Oct 2026, 1pm)', () => {
    const summary = fromFixture('whenuapai-2026102800.html')

    test('says where the readings start, to the nearest 100 m', () => {
      expect(summary.gapBelowM).toBe(1500)
    })

    test('still finds a freezing level above the gap', () => {
      expect(summary.freezing).toEqual({ kind: 'height', m: 2110 })
    })

    test('gives no wind for a height with no reading near it', () => {
      expect(summary.winds.map((w) => w.atKm)).toEqual([3, 5])
    })

    test('cannot say whether there is an inversion', () => {
      expect(summary.inversion).toBe(false)
    })
  })

  describe('freezing level', () => {
    test('is at ground level when it is freezing at the ground', () => {
      expect(summarise([level(10, -1), level(500, -4)]).freezing).toEqual({
        kind: 'ground',
      })
    })

    test('is left out when the readings start high and are already freezing', () => {
      const summary = summarise([level(1500, -1), level(2000, -4)])

      expect(summary.freezing).toBeUndefined()
      expect(summary.snowLevelM).toBeUndefined()
    })

    test('is interpolated between levels, to 10 m', () => {
      expect(summarise([level(0, 2), level(400, -2)]).freezing).toEqual({
        kind: 'height',
        m: 200,
      })
    })

    test('puts the snow level no lower than the lowest reading', () => {
      expect(summarise([level(0, 1), level(200, -1)]).snowLevelM).toBe(0)
    })
  })

  describe('cloud', () => {
    test('is none when the air is dry all the way up', () => {
      expect(summarise([level(0, 10), level(5000, -20)]).cloud).toEqual([])
    })

    test('merges layers less than 100 m apart, and drops thin ones', () => {
      const levels = [
        level(0, 10, 9),
        level(100, 9, 8),
        level(200, 8, 7),
        level(240, 8, 0),
        level(290, 7, 6),
        level(400, 6, 5),
        level(600, 5, -10),
        level(700, 4, 3),
        level(750, 3, -10),
      ]

      expect(summarise(levels).cloud).toEqual([{ fromM: 0, toM: 400 }])
    })
  })

  test('finds an inversion low down', () => {
    const levels = [level(0, 5), level(100, 5.5), level(200, 6.5), level(800, 4)]

    expect(summarise(levels).inversion).toBe(true)
  })

  describe('stability', () => {
    test('is unstable with a low lifted index or a high CAPE', () => {
      expect(summarise([level(0, 10)], { liftedIndex: -2 }).stability).toBe(
        'unstable',
      )
      expect(summarise([level(0, 10)], { cape: 500 }).stability).toBe(
        'unstable',
      )
    })

    test('is left out without both indices', () => {
      expect(
        summarise([level(0, 10)], { liftedIndex: undefined }).stability,
      ).toBeUndefined()
    })
  })
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/shared/helpers/sounding/summariseSounding.test.ts`
Expected: FAIL, "Failed to resolve import ./summariseSounding".

- [ ] **Step 3: Write the rules**

`src/shared/helpers/sounding/summariseSounding.ts`:

```ts
import type { Sounding, SoundingLevel } from './parseSounding'

export type Freezing = { kind: 'ground' } | { kind: 'height'; m: number }

export interface CloudLayer {
  fromM: number
  toM: number
}

export interface WindAt {
  atKm: number
  /** Where it blows from. */
  compass: string
  kt: number
}

/** What the "At a glance" panel says. Each fact is absent when the data can't support it. */
export interface SoundingSummary {
  /** Set when the readings start above 500 m: where they start, to 100 m. */
  gapBelowM?: number
  freezing?: Freezing
  snowLevelM?: number
  /** Lowest first, at most 3. Empty means dry. */
  cloud: CloudLayer[]
  /** False when there is none, or when the readings start too high to tell. */
  inversion: boolean
  winds: WindAt[]
  tempAt3kmC?: number
  stability?: 'stable' | 'unstable'
}

// A balloon whose readings start higher than this has missed the layer where
// fog, low cloud and inversions are, so nothing is said about it.
const LOW_COMPLETE_M = 500
// Snow usually falls this far below the freezing level before it melts.
const SNOW_BELOW_FREEZING_M = 300
// Air within this of its dew point is close to saturated: cloud.
const CLOUD_SPREAD_C = 3
const CLOUD_MIN_THICKNESS_M = 150
const CLOUD_MERGE_GAP_M = 100
const CLOUD_TOP_M = 9000
const MOST_CLOUD_LAYERS = 3
const INVERSION_BELOW_M = 1500
const INVERSION_RISE_C = 1
const INVERSION_DEPTH_M = 100
const NEAREST_WITHIN_M = 150

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

const roundTo = (value: number, step: number) =>
  Math.round(value / step) * step

/** The 8-point compass name for a direction in degrees. */
export function compassPoint(degrees: number): string {
  return COMPASS[Math.round(degrees / 45) % 8]
}

/** The level nearest a height, if one is within 150 m of it. */
export function nearestLevel(
  levels: SoundingLevel[],
  heightM: number,
): SoundingLevel | undefined {
  let nearest: SoundingLevel | undefined
  for (const level of levels) {
    if (
      !nearest ||
      Math.abs(level.heightM - heightM) < Math.abs(nearest.heightM - heightM)
    ) {
      nearest = level
    }
  }
  return nearest && Math.abs(nearest.heightM - heightM) <= NEAREST_WITHIN_M
    ? nearest
    : undefined
}

function freezingLevel(
  levels: SoundingLevel[],
  lowComplete: boolean,
): Freezing | undefined {
  if (levels[0].tempC <= 0) {
    // Freezing at the lowest reading: at the ground only if that is the ground.
    return lowComplete ? { kind: 'ground' } : undefined
  }
  for (let i = 1; i < levels.length; i++) {
    const below = levels[i - 1]
    const above = levels[i]
    if (below.tempC > 0 && above.tempC <= 0) {
      const m =
        below.heightM +
        ((0 - below.tempC) * (above.heightM - below.heightM)) /
          (above.tempC - below.tempC)
      return { kind: 'height', m: roundTo(m, 10) }
    }
  }
  return undefined
}

function cloudLayers(levels: SoundingLevel[]): CloudLayer[] {
  const moist: CloudLayer[] = []
  let current: CloudLayer | undefined
  for (const level of levels) {
    if (level.heightM >= CLOUD_TOP_M) break
    if (level.tempC - level.dewPointC <= CLOUD_SPREAD_C) {
      if (current) current.toM = level.heightM
      else current = { fromM: level.heightM, toM: level.heightM }
    } else if (current) {
      moist.push(current)
      current = undefined
    }
  }
  if (current) moist.push(current)

  const merged: CloudLayer[] = []
  for (const layer of moist) {
    const last = merged.at(-1)
    if (last && layer.fromM - last.toM < CLOUD_MERGE_GAP_M) last.toM = layer.toM
    else merged.push({ ...layer })
  }
  return merged
    .filter((layer) => layer.toM - layer.fromM >= CLOUD_MIN_THICKNESS_M)
    .slice(0, MOST_CLOUD_LAYERS)
}

function hasInversion(levels: SoundingLevel[]): boolean {
  const low = levels.filter((level) => level.heightM < INVERSION_BELOW_M)
  for (let i = 0; i < low.length; i++) {
    for (let j = i + 1; j < low.length; j++) {
      if (
        low[j].heightM - low[i].heightM >= INVERSION_DEPTH_M &&
        low[j].tempC - low[i].tempC >= INVERSION_RISE_C
      ) {
        return true
      }
    }
  }
  return false
}

/**
 * What a sounding says, in the terms the panel uses. `sounding.levels` must not
 * be empty (fetchSounding only returns soundings with levels).
 */
export function summariseSounding(sounding: Sounding): SoundingSummary {
  const { levels, liftedIndex, cape } = sounding
  const lowestM = levels[0].heightM
  const lowComplete = lowestM <= LOW_COMPLETE_M

  const freezing = freezingLevel(levels, lowComplete)
  const snowLevelM =
    freezing?.kind === 'height'
      ? Math.max(
          roundTo(freezing.m - SNOW_BELOW_FREEZING_M, 100),
          roundTo(lowestM, 100),
        )
      : undefined

  const winds = [1, 3, 5].flatMap((atKm) => {
    const level = nearestLevel(levels, atKm * 1000)
    return level
      ? [{ atKm, compass: compassPoint(level.windFromDeg), kt: level.windKt }]
      : []
  })

  return {
    gapBelowM: lowComplete ? undefined : roundTo(lowestM, 100),
    freezing,
    snowLevelM,
    cloud: cloudLayers(levels),
    inversion: lowComplete && hasInversion(levels),
    winds,
    tempAt3kmC: nearestLevel(levels, 3000)?.tempC,
    stability:
      liftedIndex === undefined || cape === undefined
        ? undefined
        : liftedIndex <= -2 || cape >= 500
          ? 'unstable'
          : 'stable',
  }
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `npx vitest run src/shared/helpers/sounding/summariseSounding.test.ts`
Expected: PASS, 18 tests.

- [ ] **Step 5: Lint and commit**

```bash
npx eslint --fix src/shared/helpers/sounding
git add src/shared/helpers/sounding
git commit -m "feat: what a balloon sounding says: freezing level, cloud, inversion, wind and stability"
```

---

### Task 3: Fetch the newest sounding with data

**Files:**
- Create: `src/shared/helpers/sounding/fetchSounding.ts`
- Test: `src/shared/helpers/sounding/fetchSounding.test.ts`

**Interfaces:**
- Consumes: `parseSounding`, `Sounding` (Task 1); `BalloonLocationCode` from `@/shared/types/balloonLocations`.
- Produces: `FetchedSounding { launchUTC: number; sounding: Sounding; sourceUrl: string }`, `fetchSounding(station: BalloonLocationCode, now?: Date): Promise<FetchedSounding | undefined>`, `latestLaunchUTC(now: Date): number`, `soundingUrl(station: BalloonLocationCode, launchUTC: number): string`.

- [ ] **Step 1: Write the failing test**

`src/shared/helpers/sounding/fetchSounding.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { fetchSounding, latestLaunchUTC, soundingUrl } from './fetchSounding'

const page = readFileSync(
  join(__dirname, 'fixtures', 'invercargill-2026102912.html'),
  'utf8',
)
const NOW = new Date('2026-10-30T05:00:00Z')
const fetchMock = vi.fn()

const datetimeOf = (call: unknown[]) =>
  new URL(String(call[0])).searchParams.get('datetime')

describe('latestLaunchUTC', () => {
  test('is the last 00 or 12 UTC at or before now', () => {
    expect(latestLaunchUTC(NOW)).toBe(Date.UTC(2026, 9, 30, 0))
    expect(latestLaunchUTC(new Date('2026-10-30T12:00:00Z'))).toBe(
      Date.UTC(2026, 9, 30, 12),
    )
  })
})

describe('soundingUrl', () => {
  test('asks Wyoming for the station at the launch time, as text', () => {
    expect(soundingUrl('93844', Date.UTC(2026, 9, 29, 12))).toBe(
      'https://weather.uwyo.edu/wsgi/sounding?datetime=2026-10-29+12%3A00%3A00&id=93844&src=UNKNOWN&type=TEXT%3ALIST',
    )
  })
})

describe('fetchSounding', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  test('returns the latest launch when it has data', async () => {
    fetchMock.mockResolvedValue(new Response(page))

    const fetched = await fetchSounding('93844', NOW)

    expect(fetched?.launchUTC).toBe(Date.UTC(2026, 9, 30, 0))
    expect(fetched?.sounding.levels).toHaveLength(3777)
    expect(fetched?.sourceUrl).toBe(String(fetchMock.mock.calls[0][0]))
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      next: { revalidate: 3600 },
    })
  })

  test('steps back a launch at a time past ones with no data', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response('Unable to retrieve the data', { status: 400 }),
      )
      .mockResolvedValueOnce(new Response('<html>no table</html>'))
      .mockResolvedValueOnce(new Response(page))

    const fetched = await fetchSounding('93844', NOW)

    expect(fetchMock.mock.calls.map(datetimeOf)).toEqual([
      '2026-10-30 00:00:00',
      '2026-10-29 12:00:00',
      '2026-10-29 00:00:00',
    ])
    expect(fetched?.launchUTC).toBe(Date.UTC(2026, 9, 29, 0))
  })

  test('gives up after four launches', async () => {
    fetchMock.mockImplementation(
      async () => new Response('Unable to retrieve the data', { status: 400 }),
    )

    expect(await fetchSounding('93844', NOW)).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  test('stops at once when Wyoming is too busy, without asking again', async () => {
    fetchMock.mockResolvedValue(
      new Response('The server is too busy, try again later.', {
        status: 503,
      }),
    )

    expect(await fetchSounding('93844', NOW)).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('stops when the request fails or times out', async () => {
    fetchMock.mockRejectedValue(new DOMException('timed out', 'TimeoutError'))

    expect(await fetchSounding('93844', NOW)).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/shared/helpers/sounding/fetchSounding.test.ts`
Expected: FAIL, "Failed to resolve import ./fetchSounding".

- [ ] **Step 3: Write the fetcher**

`src/shared/helpers/sounding/fetchSounding.ts`:

```ts
import type { BalloonLocationCode } from '@/shared/types/balloonLocations'

import { parseSounding, type Sounding } from './parseSounding'

export interface FetchedSounding {
  /** When the balloon was launched (epoch ms). */
  launchUTC: number
  sounding: Sounding
  /** The page it came from, for the credit link. */
  sourceUrl: string
}

const HALF_DAY_MS = 12 * 60 * 60 * 1000
// Two days of launches: enough to get past a missed one, few enough to be kind
// to Wyoming, which rate-limits.
const MOST_LAUNCHES = 4
const TIMEOUT_MS = 10_000

/** The last 00 or 12 UTC at or before `now`: balloons go up at those times. */
export function latestLaunchUTC(now: Date): number {
  return Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours() >= 12 ? 12 : 0,
  )
}

/** The University of Wyoming's page for one launch, as text. */
export function soundingUrl(
  station: BalloonLocationCode,
  launchUTC: number,
): string {
  const launch = new Date(launchUTC)
  const hour = String(launch.getUTCHours()).padStart(2, '0')
  const datetime = `${launch.toISOString().slice(0, 10)} ${hour}:00:00`
  const query = new URLSearchParams({
    datetime,
    id: station,
    src: 'UNKNOWN',
    type: 'TEXT:LIST',
  })
  return `https://weather.uwyo.edu/wsgi/sounding?${query}`
}

/**
 * The newest sounding with data for a station, or undefined. A launch with no
 * data (400, or a page with no table) is passed over for the one before it. Any
 * other failure, including Wyoming saying it is too busy (503), ends the search:
 * asking again would only add to its load. Only 200 responses are cached, so the
 * next render of the page asks again.
 */
export async function fetchSounding(
  station: BalloonLocationCode,
  now: Date = new Date(),
): Promise<FetchedSounding | undefined> {
  let launchUTC = latestLaunchUTC(now)
  try {
    for (let tried = 0; tried < MOST_LAUNCHES; tried++) {
      const sourceUrl = soundingUrl(station, launchUTC)
      const response = await fetch(sourceUrl, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        next: { revalidate: 3600 },
      })
      if (response.ok) {
        const sounding = parseSounding(await response.text())
        if (sounding.levels.length > 0) {
          return { launchUTC, sounding, sourceUrl }
        }
      } else if (response.status !== 400) {
        return undefined
      }
      launchUTC -= HALF_DAY_MS
    }
  } catch {
    // A network error or the timeout, while asking or while reading the page.
    return undefined
  }
  return undefined
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `npx vitest run src/shared/helpers/sounding/fetchSounding.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Type check, lint and commit**

```bash
npx tsc --noEmit -p . 2>&1 | grep -v '^\.next' | grep sounding
npx eslint --fix src/shared/helpers/sounding
git add src/shared/helpers/sounding
git commit -m "feat: fetch the newest balloon sounding with data, and stop if Wyoming is busy"
```

Expected: the `tsc` line prints nothing (no type errors in the new files).

---

### Task 4: The "At a glance" panel

**Files:**
- Create: `src/components/UpperAirPage/SoundingGlance.tsx`
- Test: `src/components/UpperAirPage/SoundingGlance.test.tsx`

**Interfaces:**
- Consumes: `SoundingSummary` (Task 2); `FetchedSounding` (Task 3); `formatInTimeZone`, `DEFAULT_TIME_ZONE` from `@/shared/helpers/timeZone`.
- Produces: `SoundingGlance({ summary, launchUTC, sourceUrl }: { summary: SoundingSummary; launchUTC: number; sourceUrl: string })`, and `formatHeight(m: number): string`, `formatTemperature(c: number): string`, `balloonTime(launchUTC: number): string` (exported for Task 5).

- [ ] **Step 1: Write the failing test**

`src/components/UpperAirPage/SoundingGlance.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'

import type { SoundingSummary } from '@/shared/helpers/sounding/summariseSounding'

import { SoundingGlance } from './SoundingGlance'

const full: SoundingSummary = {
  freezing: { kind: 'height', m: 970 },
  snowLevelM: 700,
  cloud: [
    { fromM: 581, toM: 918 },
    { fromM: 1071, toM: 1433 },
  ],
  inversion: false,
  winds: [
    { atKm: 1, compass: 'W', kt: 33 },
    { atKm: 3, compass: 'W', kt: 47 },
    { atKm: 5, compass: 'SW', kt: 56 },
  ],
  tempAt3kmC: -14,
  stability: 'stable',
}
// Friday 30 October 2026, 1:00am in New Zealand.
const LAUNCH = Date.UTC(2026, 9, 29, 12)
const SOURCE = 'https://weather.uwyo.edu/wsgi/sounding?id=93844'

const renderGlance = (summary: SoundingSummary) =>
  render(
    <SoundingGlance summary={summary} launchUTC={LAUNCH} sourceUrl={SOURCE} />,
  )
const panel = () => screen.getByRole('region', { name: 'At a glance' })

describe('<SoundingGlance />', () => {
  test('says what the balloon found, in plain words', () => {
    renderGlance(full)

    expect(panel()).toHaveTextContent(
      'Freezing level 970 m · snow possible down to about 700 m',
    )
    expect(panel()).toHaveTextContent('Cloud 600 – 900 m, 1,100 – 1,400 m')
    expect(panel()).toHaveTextContent(
      'Wind W 33 kt at 1 km · W 47 kt at 3 km · SW 56 kt at 5 km',
    )
    expect(panel()).toHaveTextContent('−14 °C at 3,000 m')
    expect(panel()).toHaveTextContent('Stable: thunderstorms unlikely')
  })

  test('says which balloon, and credits the data with a link', () => {
    renderGlance(full)

    expect(panel()).toHaveTextContent(
      "From Friday 1:00am's balloon · University of Wyoming data. What the balloon measured, not a forecast.",
    )
    expect(
      screen.getByRole('link', { name: 'University of Wyoming data' }),
    ).toHaveAttribute('href', SOURCE)
  })

  test('says the air is dry when there is no cloud', () => {
    renderGlance({ ...full, cloud: [] })

    expect(panel()).toHaveTextContent('Dry: no cloud layers')
  })

  test('mentions an inversion only when there is one', () => {
    renderGlance({ ...full, inversion: true })

    expect(panel()).toHaveTextContent(
      'Inversion near the ground: fog, haze or smog can be trapped',
    )
  })

  test('says freezing at ground level', () => {
    renderGlance({ ...full, freezing: { kind: 'ground' }, snowLevelM: undefined })

    expect(panel()).toHaveTextContent('Freezing at ground level')
    expect(panel()).not.toHaveTextContent('snow possible')
  })

  test('states a gap, and leaves out what it cannot say', () => {
    renderGlance({
      gapBelowM: 1500,
      cloud: [],
      inversion: false,
      winds: [],
    })

    expect(panel()).toHaveTextContent('No readings below 1,500 m from this balloon')
    expect(panel()).not.toHaveTextContent('Freezing')
    expect(panel()).not.toHaveTextContent('Wind')
    expect(panel()).not.toHaveTextContent('°C at 3,000 m')
    expect(panel()).not.toHaveTextContent('thunderstorms')
  })

  test('says thunderstorms are possible in unstable air', () => {
    renderGlance({ ...full, stability: 'unstable' })

    expect(panel()).toHaveTextContent('Unstable: thunderstorms possible')
  })
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/components/UpperAirPage/SoundingGlance.test.tsx`
Expected: FAIL, "Failed to resolve import ./SoundingGlance".

- [ ] **Step 3: Write the panel**

`src/components/UpperAirPage/SoundingGlance.tsx`:

```tsx
import type { ReactNode } from 'react'

import type { SoundingSummary } from '@/shared/helpers/sounding/summariseSounding'
import { DEFAULT_TIME_ZONE, formatInTimeZone } from '@/shared/helpers/timeZone'

/** A height for reading: "1,500". */
export const formatHeight = (m: number) => m.toLocaleString('en-NZ')

/** A temperature for reading, with a true minus sign: "−14". */
export const formatTemperature = (c: number) =>
  `${Math.round(c) < 0 ? '−' : ''}${Math.abs(Math.round(c))}`

/** When the balloon went up, as people say it: "Friday 1:00am". */
export const balloonTime = (launchUTC: number) =>
  formatInTimeZone(launchUTC, 'EEEE h:mmaaa', DEFAULT_TIME_ZONE)

const to100 = (m: number) => formatHeight(Math.round(m / 100) * 100)

function Line({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <li className="border-rule grid grid-cols-[1.25rem_1fr] gap-2 border-t py-1.5 first:border-t-0">
      <span aria-hidden="true" className="text-center">
        {icon}
      </span>
      <span>{children}</span>
    </li>
  )
}

/**
 * What the latest weather balloon found, in plain words, above the chart. Only
 * what the data supports is said: a line is left out rather than guessed, and a
 * gap in the readings is stated.
 */
export function SoundingGlance({
  summary,
  launchUTC,
  sourceUrl,
}: {
  summary: SoundingSummary
  launchUTC: number
  sourceUrl: string
}) {
  const { freezing, snowLevelM, cloud, winds, tempAt3kmC, stability } = summary

  return (
    <section
      aria-label="At a glance"
      className="bg-plate border-cold mx-auto mb-4 max-w-176 border-l-4 px-4 py-3 text-sm leading-snug"
    >
      <h2 className="font-display mb-2 text-lg font-bold tracking-wide uppercase">
        At a glance
      </h2>
      <ul>
        {summary.gapBelowM !== undefined && (
          <Line icon="↧">
            No readings below {formatHeight(summary.gapBelowM)} m from this
            balloon
          </Line>
        )}
        {freezing?.kind === 'ground' && (
          <Line icon="❄︎">
            <b>Freezing at ground level</b>
          </Line>
        )}
        {freezing?.kind === 'height' && (
          <Line icon="❄︎">
            <b>Freezing level {formatHeight(freezing.m)} m</b>
            {snowLevelM !== undefined &&
              ` · snow possible down to about ${formatHeight(snowLevelM)} m`}
          </Line>
        )}
        <Line icon="☁︎">
          {cloud.length === 0 ? (
            'Dry: no cloud layers'
          ) : (
            <>
              <b>Cloud</b>{' '}
              {cloud
                .map((layer) => `${to100(layer.fromM)} – ${to100(layer.toM)} m`)
                .join(', ')}
            </>
          )}
        </Line>
        {summary.inversion && (
          <Line icon="≋">
            Inversion near the ground: fog, haze or smog can be trapped
          </Line>
        )}
        {winds.length > 0 && (
          <Line icon="➚">
            <b>Wind</b>{' '}
            {winds
              .map((wind) => `${wind.compass} ${wind.kt} kt at ${wind.atKm} km`)
              .join(' · ')}
          </Line>
        )}
        {tempAt3kmC !== undefined && (
          <Line icon="🌡︎">
            <b>{formatTemperature(tempAt3kmC)} °C at 3,000 m</b>
          </Line>
        )}
        {stability && (
          <Line icon="ϟ">
            {stability === 'unstable'
              ? 'Unstable: thunderstorms possible'
              : 'Stable: thunderstorms unlikely'}
          </Line>
        )}
      </ul>
      <p className="text-ink-soft mt-2 font-mono text-xs">
        From {balloonTime(launchUTC)}&apos;s balloon ·{' '}
        <a href={sourceUrl} className="underline underline-offset-2">
          University of Wyoming data
        </a>
        . What the balloon measured, not a forecast.
      </p>
    </section>
  )
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `npx vitest run src/components/UpperAirPage/SoundingGlance.test.tsx`
Expected: PASS, 7 tests. If the "Friday 1:00am" assertion fails, print `balloonTime(LAUNCH)` and check `formatInTimeZone`'s argument order in `src/shared/helpers/timeZone.ts`.

- [ ] **Step 5: Lint and commit**

```bash
npx eslint --fix src/components/UpperAirPage
git add src/components/UpperAirPage
git commit -m "feat: an At a glance panel of what the latest weather balloon found"
```

---

### Task 5: Our chart

**Files:**
- Create: `src/components/UpperAirPage/SoundingChart.tsx`
- Test: `src/components/UpperAirPage/SoundingChart.test.tsx`

**Interfaces:**
- Consumes: `Sounding` (Task 1); `SoundingSummary`, `nearestLevel` (Task 2); `formatHeight`, `balloonTime` (Task 4); `formatInTimeZone`, `DEFAULT_TIME_ZONE`.
- Produces: `SoundingChart({ sounding, summary, launchUTC, sourceUrl, metvuwNewestUTC }: { sounding: Sounding; summary: SoundingSummary; launchUTC: number; sourceUrl: string; metvuwNewestUTC?: number })`.

- [ ] **Step 1: Write the failing test**

`src/components/UpperAirPage/SoundingChart.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { parseSounding } from '@/shared/helpers/sounding/parseSounding'
import { summariseSounding } from '@/shared/helpers/sounding/summariseSounding'

import { SoundingChart } from './SoundingChart'

const sounding = parseSounding(
  readFileSync(
    join(
      __dirname,
      '../../shared/helpers/sounding/fixtures/invercargill-2026102912.html',
    ),
    'utf8',
  ),
)
const summary = summariseSounding(sounding)
const LAUNCH = Date.UTC(2026, 9, 29, 12)
const SOURCE = 'https://weather.uwyo.edu/wsgi/sounding?id=93844'

const renderChart = (metvuwNewestUTC?: number) =>
  render(
    <SoundingChart
      sounding={sounding}
      summary={summary}
      launchUTC={LAUNCH}
      sourceUrl={SOURCE}
      metvuwNewestUTC={metvuwNewestUTC}
    />,
  )

describe('<SoundingChart />', () => {
  test('draws the temperature and dew point by height', () => {
    renderChart()

    const chart = screen.getByRole('img', { name: /Balloon sounding/ })
    expect(chart.querySelector('[data-line="temperature"]')).toBeInTheDocument()
    expect(chart.querySelector('[data-line="dew-point"]')).toBeInTheDocument()
  })

  test('marks the cloud layers and the freezing level', () => {
    const { container } = renderChart()

    expect(container.querySelectorAll('[data-cloud]')).toHaveLength(2)
    expect(container.querySelector('[data-freezing]')).toHaveTextContent(
      'FREEZING 970 m',
    )
  })

  test('shows the wind at each kilometre up to 9 km', () => {
    const { container } = renderChart()

    expect(container.querySelectorAll('[data-wind]')).toHaveLength(9)
  })

  test('says where metvuw stops, and which balloon this is', () => {
    renderChart(Date.UTC(2026, 9, 12, 11))

    expect(screen.getByRole('figure')).toHaveTextContent(
      "metvuw's charts stop at 13 Oct; this chart is drawn from Friday 1:00am's balloon.",
    )
  })

  test('says which balloon when metvuw has no charts', () => {
    renderChart()

    expect(screen.getByRole('figure')).toHaveTextContent(
      "This chart is drawn from Friday 1:00am's balloon.",
    )
  })

  test('explains the arrows and credits the data', () => {
    renderChart()

    expect(screen.getByRole('figure')).toHaveTextContent(
      'Arrows show where the wind blows to',
    )
    expect(
      screen.getByRole('link', { name: 'University of Wyoming data' }),
    ).toHaveAttribute('href', SOURCE)
  })
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/components/UpperAirPage/SoundingChart.test.tsx`
Expected: FAIL, "Failed to resolve import ./SoundingChart".

- [ ] **Step 3: Write the chart**

`src/components/UpperAirPage/SoundingChart.tsx`:

```tsx
import type {
  Sounding,
  SoundingLevel,
} from '@/shared/helpers/sounding/parseSounding'
import {
  nearestLevel,
  type SoundingSummary,
} from '@/shared/helpers/sounding/summariseSounding'
import { DEFAULT_TIME_ZONE, formatInTimeZone } from '@/shared/helpers/timeZone'

import { balloonTime, formatHeight } from './SoundingGlance'

// The chart's own units: 358 wide, and the plot inside the margins.
const WIDTH = 358
const HEIGHT = 470
const LEFT = 34
const RIGHT = 300
const TOP = 24
const BOTTOM = 440
const TOP_M = 10_000
const MIN_C = -90
const MAX_C = 15
// One point per 100 m is plenty to draw: a sounding has thousands of levels.
const POINT_EVERY_M = 100

const x = (c: number) => LEFT + ((c - MIN_C) / (MAX_C - MIN_C)) * (RIGHT - LEFT)
const y = (m: number) => BOTTOM - (m / TOP_M) * (BOTTOM - TOP)

/**
 * The latest balloon's sounding, drawn simply: height up the side, temperature
 * and dew point across, with cloud shaded, the freezing level marked, and the
 * wind at each kilometre. Shown in place of metvuw's tephigram when that is
 * older than the balloon.
 */
export function SoundingChart({
  sounding,
  summary,
  launchUTC,
  sourceUrl,
  metvuwNewestUTC,
}: {
  sounding: Sounding
  summary: SoundingSummary
  launchUTC: number
  sourceUrl: string
  metvuwNewestUTC?: number
}) {
  const points: SoundingLevel[] = []
  let lastM = -Infinity
  for (const level of sounding.levels) {
    if (level.heightM > TOP_M) break
    if (level.heightM - lastM >= POINT_EVERY_M) {
      points.push(level)
      lastM = level.heightM
    }
  }
  const path = (value: (level: SoundingLevel) => number) =>
    points
      .map(
        (level, i) =>
          `${i ? 'L' : 'M'}${x(value(level)).toFixed(1)},${y(level.heightM).toFixed(1)}`,
      )
      .join('')

  const winds = [1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((km) => {
    const level = nearestLevel(sounding.levels, km * 1000)
    return level ? [{ km, level }] : []
  })
  const freezingM =
    summary.freezing?.kind === 'height' ? summary.freezing.m : undefined
  const when = balloonTime(launchUTC)

  return (
    <figure className="mx-auto max-w-176 px-4 md:px-0">
      <div className="bg-plate rounded-xl p-2 shadow-lg">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Balloon sounding: temperature and dew point by height, with cloud, the freezing level and wind"
          className="block w-full font-mono text-[11px]"
        >
          {[0, 2, 4, 6, 8, 10].map((km) => (
            <g key={km}>
              <line
                x1={LEFT}
                x2={RIGHT}
                y1={y(km * 1000)}
                y2={y(km * 1000)}
                className="stroke-rule"
              />
              <text
                x={LEFT - 6}
                y={y(km * 1000) + 4}
                textAnchor="end"
                className="fill-ink-soft"
              >
                {km}
              </text>
            </g>
          ))}
          {[-80, -60, -40, -20, 0].map((c) => (
            <text
              key={c}
              x={x(c)}
              y={BOTTOM + 16}
              textAnchor="middle"
              className="fill-ink-soft"
            >
              {c}°
            </text>
          ))}
          <text x={LEFT - 6} y={TOP - 12} textAnchor="end" className="fill-ink-soft">
            km
          </text>
          <text x={322} y={TOP - 12} textAnchor="middle" className="fill-ink-soft">
            kt
          </text>
          {summary.cloud
            .filter((layer) => layer.fromM < TOP_M)
            .map((layer) => (
              <rect
                key={layer.fromM}
                data-cloud
                x={LEFT}
                width={RIGHT - LEFT}
                y={y(Math.min(layer.toM, TOP_M))}
                height={y(layer.fromM) - y(Math.min(layer.toM, TOP_M))}
                className="fill-cold/15"
              />
            ))}
          {freezingM !== undefined && freezingM < TOP_M && (
            <g data-freezing>
              <line
                x1={LEFT}
                x2={RIGHT}
                y1={y(freezingM)}
                y2={y(freezingM)}
                strokeDasharray="6 4"
                className="stroke-warm"
              />
              <text
                x={RIGHT - 4}
                y={y(freezingM) - 5}
                textAnchor="end"
                className="fill-warm"
              >
                FREEZING {formatHeight(freezingM)} m
              </text>
            </g>
          )}
          <path
            data-line="dew-point"
            d={path((level) => level.dewPointC)}
            fill="none"
            strokeWidth={2.2}
            className="stroke-cold"
          />
          <path
            data-line="temperature"
            d={path((level) => level.tempC)}
            fill="none"
            strokeWidth={2.6}
            className="stroke-warm"
          />
          {winds.map(({ km, level }) => (
            // The arrow points where the wind blows to.
            <g key={km} data-wind>
              <g
                transform={`translate(322,${y(km * 1000)}) rotate(${level.windFromDeg + 180})`}
              >
                <line y1={8} y2={-8} strokeWidth={2} className="stroke-ink" />
                <path
                  d="M-4,-3 L0,-9 L4,-3"
                  fill="none"
                  strokeWidth={2}
                  className="stroke-ink"
                />
              </g>
              <text x={335} y={y(km * 1000) + 4} className="fill-ink-soft">
                {level.windKt}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <figcaption className="text-ink-soft mt-2 space-y-1 font-mono text-xs">
        <p>
          {metvuwNewestUTC !== undefined
            ? `metvuw's charts stop at ${formatInTimeZone(metvuwNewestUTC, 'd MMM', DEFAULT_TIME_ZONE)}; this chart is drawn from ${when}'s balloon.`
            : `This chart is drawn from ${when}'s balloon.`}
        </p>
        <p>
          <span className="text-warm">Red: temperature.</span>{' '}
          <span className="text-cold">Blue: dew point.</span> Where they meet,
          the air is saturated: cloud. Arrows show where the wind blows to, with
          its speed in knots. ·{' '}
          <a href={sourceUrl} className="underline underline-offset-2">
            University of Wyoming data
          </a>
        </p>
      </figcaption>
    </figure>
  )
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `npx vitest run src/components/UpperAirPage/SoundingChart.test.tsx`
Expected: PASS, 6 tests. "13 Oct" is right: 11:00 UTC on 12 October is 00:00 on 13 October in New Zealand (NZDT).

- [ ] **Step 5: Type check, lint and commit**

```bash
npx tsc --noEmit -p . 2>&1 | grep -v '^\.next' | grep UpperAirPage
npx eslint --fix src/components/UpperAirPage
git add src/components/UpperAirPage
git commit -m "feat: our own simple chart of the latest balloon sounding"
```

Expected: the `tsc` line prints nothing.

---

### Task 6: Show the panel, and our chart when metvuw's is older

**Files:**
- Create: `src/shared/helpers/sounding/showOwnChart.ts`, `src/shared/helpers/sounding/showOwnChart.test.ts`
- Modify: `src/components/UpperAirPage/UpperAirPage.tsx`
- Modify: `src/app/upperair/[[...balloon]]/page.tsx`

**Interfaces:**
- Consumes: `fetchSounding`, `FetchedSounding` (Task 3); `summariseSounding` (Task 2); `SoundingGlance` (Task 4); `SoundingChart` (Task 5).
- Produces: `showOwnChart(metvuwTimesUTC: number[], launchUTC: number): boolean`; `UpperAirPage` gains an optional `sounding?: FetchedSounding` prop.

- [ ] **Step 1: Write the failing test**

`src/shared/helpers/sounding/showOwnChart.test.ts`:

```ts
import { showOwnChart } from './showOwnChart'

const launch = Date.UTC(2026, 9, 29, 12)

describe('showOwnChart', () => {
  test("is true when metvuw's newest chart is older than the balloon", () => {
    expect(showOwnChart([launch - 1, launch - 2], launch)).toBe(true)
  })

  test("is false when metvuw's newest chart is as recent as the balloon", () => {
    expect(showOwnChart([launch - 1, launch], launch)).toBe(false)
  })

  test('is true when metvuw has no charts', () => {
    expect(showOwnChart([], launch)).toBe(true)
  })
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/shared/helpers/sounding/showOwnChart.test.ts`
Expected: FAIL, "Failed to resolve import ./showOwnChart".

- [ ] **Step 3: Write the rule**

`src/shared/helpers/sounding/showOwnChart.ts`:

```ts
/**
 * Whether our chart replaces metvuw's: when metvuw has nothing as recent as the
 * balloon we have (metvuw stopped publishing upper air charts on 12 Oct 2026).
 */
export function showOwnChart(
  metvuwTimesUTC: number[],
  launchUTC: number,
): boolean {
  return (
    metvuwTimesUTC.length === 0 || Math.max(...metvuwTimesUTC) < launchUTC
  )
}
```

- [ ] **Step 4: Run it to see it pass**

Run: `npx vitest run src/shared/helpers/sounding/showOwnChart.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Show the panel and choose the chart in `UpperAirPage`**

Replace the whole of `src/components/UpperAirPage/UpperAirPage.tsx` with:

```tsx
import { useMemo } from 'react'

import { AnimationProvider } from '@/components/Animation/Animation'
import { FooterControl } from '@/components/FooterControl'
import { PageTopEnd } from '@/components/FooterControl/PageTopEnd'
import { ImageProgressProvider } from '@/components/ImageProgress/ImageProgress'
import SubHeader from '@/components/SubHeader'
import { expectedLoadedImages } from '@/shared/helpers/imageLoading'
import type { FetchedSounding } from '@/shared/helpers/sounding/fetchSounding'
import { showOwnChart } from '@/shared/helpers/sounding/showOwnChart'
import { summariseSounding } from '@/shared/helpers/sounding/summariseSounding'
import {
  BalloonLocationCode,
  balloonLocations,
} from '@/shared/types/balloonLocations'
import { SkinnyChartData } from '@/shared/types/chartData'

import RadarAndSatelliteImages from '../RadarAndSatelliteImages/RadarAndSatelliteImages'
import { SoundingChart } from './SoundingChart'
import { SoundingGlance } from './SoundingGlance'
import { UpperAirExplainer } from './UpperAirExplainer'

export function UpperAirPage({
  chartData,
  balloonCode,
  sounding,
}: {
  chartData: SkinnyChartData[]
  balloonCode: BalloonLocationCode
  /** The latest balloon with data, from the University of Wyoming, if any. */
  sounding?: FetchedSounding
}) {
  // When each chart is for, so the footer can draw a time axis.
  const times = useMemo(
    () => chartData.map((chart) => chart.imageDateUTC),
    [chartData],
  )
  const summary = sounding && summariseSounding(sounding.sounding)
  const header = (
    <>
      <SubHeader eyebrow="Upper air" title={balloonLocations[balloonCode]} />
      {sounding && summary && (
        <SoundingGlance
          summary={summary}
          launchUTC={sounding.launchUTC}
          sourceUrl={sounding.sourceUrl}
        />
      )}
      <UpperAirExplainer />
    </>
  )

  // Our chart replaces metvuw's when metvuw has nothing as recent. There is no
  // footer then: its time axis and viewer step through metvuw's series.
  if (sounding && summary && showOwnChart(times, sounding.launchUTC)) {
    return (
      <div className="min-h-[calc(100vh-4rem)] pb-8">
        {header}
        <SoundingChart
          sounding={sounding.sounding}
          summary={summary}
          launchUTC={sounding.launchUTC}
          sourceUrl={sounding.sourceUrl}
          metvuwNewestUTC={times.length > 0 ? Math.max(...times) : undefined}
        />
      </div>
    )
  }

  return (
    <ImageProgressProvider expected={expectedLoadedImages(chartData.length)}>
      <AnimationProvider
        count={chartData.length}
        times={times}
        intervalMs={1000}
      >
        {/* This outer div manages the layout for content and the sticky footer.
            It takes at least the height of the viewport minus the navbar (h-16). */}
        <div className="flex min-h-[calc(100vh-4rem)] flex-col">
          {/* This div contains the main page content and grows to fill space */}
          <div className="flex-grow">
            {header}
            <PageTopEnd />
            <RadarAndSatelliteImages images={chartData} chartType="Upper Air" />
          </div>
          <FooterControl />
        </div>
      </AnimationProvider>
    </ImageProgressProvider>
  )
}
```

- [ ] **Step 6: Fetch the sounding in the page**

In `src/app/upperair/[[...balloon]]/page.tsx`, add the import below the `getUpperAirChartDataForCode` import:

```ts
import { fetchSounding } from '@/shared/helpers/sounding/fetchSounding'
```

and replace the end of `Page`, from `const chartData = ...` to the closing `)` of the return, with:

```tsx
  // metvuw's charts and the balloon data, side by side: neither waits on the other.
  const [chartData, sounding] = await Promise.all([
    getUpperAirChartDataForCode(balloonLocationCode),
    fetchSounding(balloonLocationCode),
  ])
  if (chartData.length === 0 && !sounding) {
    return <NoForecast />
  }

  return (
    <UpperAirPage
      balloonCode={balloonLocationCode}
      chartData={chartData}
      sounding={sounding}
    />
  )
```

- [ ] **Step 7: Keep the route tests off the network**

`src/app/routes.test.tsx` renders the upper air page, which now asks Wyoming. Add this below its `vi.mock('@/shared/helpers/dataSource/getWeatherChartData', ...)` block, so the page gets no sounding there and behaves as before:

```ts
vi.mock('@/shared/helpers/sounding/fetchSounding', () => ({
  fetchSounding: vi.fn().mockResolvedValue(undefined),
}))
```

- [ ] **Step 8: Run the unit suite, type check and lint**

```bash
npx vitest run 2>&1 | grep -E 'Test Files|Tests  '
npx tsc --noEmit -p . 2>&1 | grep -v '^\.next' | grep -v '^  '
npx eslint --fix src/components/UpperAirPage src/shared/helpers/sounding 'src/app/upperair'
```

Expected: every test file passes; `tsc` prints nothing; ESLint prints nothing.

- [ ] **Step 9: Commit**

```bash
git add src/shared/helpers/sounding src/components/UpperAirPage 'src/app/upperair' src/app/*.test.ts*
git commit -m "feat: upper air pages show what the latest balloon found, and our chart when metvuw's is older"
```

---

### Task 7: End to end, with Wyoming stubbed

**Files:**
- Modify: `e2e/stub/redirect-metvuw.mjs`, `e2e/stub/redirect-metvuw.test.mjs`
- Modify: `e2e/stub/metvuw-stub.mjs`
- Create: `e2e/upper-air-sounding.spec.ts`
- Modify: `e2e/accessibility.spec.ts`

**Interfaces:**
- Consumes: the fixtures from Task 1; the page from Task 6.
- Produces: the stub answers `GET /wsgi/sounding?id=…`: `93844` → the Invercargill fixture (200), `93417` → the Whenuapai fixture (200, the incomplete one), anything else → 400 "Unable to retrieve the data".

- [ ] **Step 1: Write the failing redirect test**

Add to the `describe('redirectMetvuw', ...)` block in `e2e/stub/redirect-metvuw.test.mjs`:

```js
  test('sends the University of Wyoming to the stub too', async () => {
    const { calls, fetch } = setup()

    await fetch(
      'https://weather.uwyo.edu/wsgi/sounding?id=93844&type=TEXT%3ALIST',
    )

    expect(requestedUrl(calls[0])).toBe(
      `${STUB}/wsgi/sounding?id=93844&type=TEXT%3ALIST`,
    )
  })
```

Run: `npx vitest run e2e/stub/redirect-metvuw.test.mjs`
Expected: FAIL, the new test receives the `weather.uwyo.edu` URL unchanged.

- [ ] **Step 2: Redirect Wyoming too**

In `e2e/stub/redirect-metvuw.mjs`, update the top comment's first sentence to "...so the pages' server-side fetches of metvuw.com, and of the University of Wyoming's balloon data, go to the e2e stub instead." Then add above `export function redirectMetvuw`:

```js
// The hosts the app's server fetches from.
const STUBBED_HOSTS = new Set(['metvuw.com', 'weather.uwyo.edu'])
```

and replace

```js
    if (url.hostname !== 'metvuw.com') return realFetch(input, init)
```

with

```js
    if (!STUBBED_HOSTS.has(url.hostname)) return realFetch(input, init)
```

Run: `npx vitest run e2e/stub/redirect-metvuw.test.mjs`
Expected: PASS.

- [ ] **Step 3: Answer for soundings in the stub**

In `e2e/stub/metvuw-stub.mjs`, add `import { readFileSync } from 'node:fs'` above `import http from 'node:http'`. Below `const FAILING_REGION = 'estonia'` add:

```js
// Balloon soundings, as the University of Wyoming serves them. Invercargill gets
// a complete one and Paraparaumu one missing its lowest readings; Whenuapai, the
// default page most tests use, gets none, so it stays as it was.
const sounding = (name) =>
  readFileSync(
    new URL(`../../src/shared/helpers/sounding/fixtures/${name}`, import.meta.url),
    'utf8',
  )
const SOUNDINGS = {
  93844: sounding('invercargill-2026102912.html'),
  93417: sounding('whenuapai-2026102800.html'),
}
```

and add this entry to the `pages` object:

```js
  '/wsgi/sounding': (query) => {
    const body = SOUNDINGS[query.get('id') ?? '']
    return body
      ? { body }
      : {
          status: 400,
          body: `Unable to retrieve the data for ${query.get('id')} at ${query.get('datetime')}.`,
        }
  },
```

- [ ] **Step 4: Write the end-to-end tests**

`e2e/upper-air-sounding.spec.ts`:

```ts
import { expect, type Page, test } from '@playwright/test'

// The stub's metvuw upper air charts are from 11–14 Oct 2026, older than any
// balloon the page asks for, so a station with a sounding gets our chart.
const glance = (page: Page) =>
  page.getByRole('region', { name: 'At a glance' })

test.describe('upper air: what the balloon found', () => {
  test('shows the panel and our chart in place of metvuw\'s @mobile', async ({
    page,
  }) => {
    await page.goto('/upperair/93844')

    await expect(glance(page)).toContainText('Freezing level 970 m')
    await expect(glance(page)).toContainText('Stable: thunderstorms unlikely')
    await expect(
      page.getByRole('img', { name: /Balloon sounding/ }),
    ).toBeVisible()
    await expect(
      page.getByRole('img', { name: /upper air chart for/i }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('slider', { name: 'Chart position' }),
    ).toHaveCount(0)
  })

  test('says where the readings start when the lowest are missing', async ({
    page,
  }) => {
    await page.goto('/upperair/93417')

    await expect(glance(page)).toContainText(
      'No readings below 1,500 m from this balloon',
    )
    await expect(
      page.getByRole('img', { name: /Balloon sounding/ }),
    ).toBeVisible()
  })

  test('is as before when there is no balloon data', async ({ page }) => {
    await page.goto('/upperair/93112')

    await expect(glance(page)).toHaveCount(0)
    await expect(
      page.getByRole('img', { name: /upper air chart for/i }),
    ).toHaveCount(8)
  })
})
```

In `e2e/accessibility.spec.ts`, add below `['upper air', '/upperair'],`:

```ts
  ['upper air, with our chart', '/upperair/93844'],
```

- [ ] **Step 5: Build with the stub and run the e2e tests**

```bash
npm run e2e:build > /tmp/e2e-build.log 2>&1 && npx playwright test e2e/upper-air-sounding.spec.ts e2e/upper_air_page.spec.ts e2e/accessibility.spec.ts e2e/chart-help.spec.ts --project=chromium --project="Mobile Chrome" --reporter=line
```

Expected: all pass. Firefox may not run locally (CI runs it). If the build fails, read the end of `/tmp/e2e-build.log`.

- [ ] **Step 6: Commit**

```bash
npx eslint --fix e2e
git add e2e
git commit -m "test: end to end checks of the balloon panel and our chart, with Wyoming stubbed"
```

---

### Task 8: Check Wyoming's terms, then the whole suite

**Files:** none changed unless the terms require a different credit.

- [ ] **Step 1: Read Wyoming's terms of use**

Open https://weather.uwyo.edu/upperair/sounding.html and the site's footer links, and look for terms, a disclaimer or a data-use statement. Note what they say about reusing the data on a public website and how to credit it.

If they forbid this use, stop and tell the user before continuing. If they ask for particular credit wording, change the link text "University of Wyoming data" in `SoundingGlance.tsx` and `SoundingChart.tsx` (and their tests) to match, and commit with `fix: credit the balloon data as the University of Wyoming asks`.

- [ ] **Step 2: Run everything CI runs**

```bash
npx eslint .
npx tsc --noEmit -p . 2>&1 | grep -v '^\.next' | grep -v '^  '
npx vitest run 2>&1 | grep -E 'Test Files|Tests  '
npx playwright test --project=chromium --project="Mobile Chrome" --project=webkit --reporter=line 2>&1 | tail -5
```

Expected: ESLint and `tsc` print no errors; Vitest reports every file passing; Playwright reports no failures. Fix anything that fails before moving on.

- [ ] **Step 3: See it in a browser**

```bash
npm run dev
```

Open http://localhost:3002/upperair/93844 and http://localhost:3002/upperair/93112. Each should show "At a glance" with live data (if Wyoming answers) and our chart while metvuw's charts are older. Check it in dark mode too (Settings → Theme).
