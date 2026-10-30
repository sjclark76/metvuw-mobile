# MetService warnings for pinned places: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Official MetService alerts for a visitor's pins appear as lines above the heavy rain heads-up, in the band at the top of region forecast pages.

**Architecture:** A server route fetches MetService's public CAP feed, tidies it and caches it for 5 minutes. The browser fetches that once, matches each pin against the alert polygons itself (pins never leave the device), and `HeavyRainNote` renders the matches first.

**Tech Stack:** Next.js 16 App Router (route handler, client components), React 19, TypeScript, `cheerio` in XML mode (already a dependency), Tailwind CSS 4, Vitest + Testing Library, Playwright with the e2e stub.

**Spec:** `docs/superpowers/specs/2026-10-30-metservice-warnings-design.md`

## Global constraints

- Feed: `https://alerts.metservice.com/cap/atom`; each entry links to `https://alerts.metservice.com/cap/alert?id=...`. Only links starting `https://alerts.metservice.com/cap/alert?` are followed.
- Keep an alert only if `status` is `Actual`, `msgType` is not `Cancel`, `scope` is `Public`, and its `expires` is after now. Drop an `info` block with no polygon. Each `info` block is its own alert; id is the identifier, with `#1`, `#2` for later blocks.
- Polygons are `lat,lon` pairs: round each to 2 decimal places and drop consecutive duplicates; keep a polygon only if it has 3 or more points.
- `web` must be `https` on `metservice.com` or a subdomain, else `https://www.metservice.com/warnings/home`. `ColourCodeHex` must match `#rrggbb`, else it is dropped.
- Route cache: `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=300`; failure is 502 with `UPSTREAM_ERROR_CACHE_CONTROL` (from `@/shared/helpers/dataSource/imageCache`). The fetches share one 8 s limit and use `next: { revalidate: 300 }`.
- Order: colour (Red, Orange, Yellow, none), then severity (Extreme, Severe, Moderate, Minor), then earliest onset. At most 3 lines, then "and N more".
- Line copy, exactly: "Strong Wind Watch at Wanaka: until Fri 9:00pm"; not yet started: "...: from Fri 12:00pm"; pins named with `chartLabel`, joined "A", "A and B", "A, B and C"; times in the viewer's zone with the format `EEE h:mmaaa`. Region label (accessible name): "Weather alerts".
- Credit line, exactly: "Alerts from MetService, licensed CC BY 4.0; areas simplified." with "MetService" linked to `https://www.metservice.com` and "CC BY 4.0" to `https://creativecommons.org/licenses/by/4.0/`.
- Alert links open in a new tab: `target="_blank" rel="noopener noreferrer"`.
- Settings: label "Show weather warnings", description "Notes at the top of a chart page: official MetService alerts for a place you have added, and heavy rain the charts show ahead there." The analytics setting name stays `heavy_rain`.
- Only the browser matches pins to alerts; nothing about pins is sent to the server.
- Code style: Prettier via `npx eslint --fix <paths>`; single quotes, no semicolons; comments say why. Commit messages end with a blank line and `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## File map

| File | Status | Responsibility |
|---|---|---|
| `src/shared/helpers/warnings/fixtures/{wind-hawkes-bay,road-snow-lewis-pass}.xml`, `atom.xml` | already in the working tree (untracked) | Real CAP alerts and the feed, signatures stripped |
| `src/shared/helpers/warnings/parseCapAlert.ts` (+ test) | create | One CAP alert → `WeatherAlert[]` |
| `src/shared/helpers/warnings/fetchWarnings.ts` (+ test) | create | The feed, then each alert |
| `src/app/api/warnings/route.ts` (+ test) | create | The cached JSON, or 502 |
| `src/shared/helpers/warnings/alertsForPins.ts` (+ test) | create | Point-in-polygon, expiry, grouping, order |
| `src/components/RainStrip/useWeatherAlerts.ts` (+ test) | create | The browser fetch |
| `src/components/RainStrip/RainWatch.tsx` | modify | Puts matched alerts in the context |
| `src/components/RainStrip/band.ts` | create | The band's class and `MOST_SHOWN`, shared |
| `src/components/RainStrip/AlertLines.tsx` (+ test) | create | The alert lines and credit |
| `src/components/RainStrip/HeavyRainNote.tsx` | modify | Renders `AlertLines` first; uses `band.ts` |
| `src/components/Settings/SettingsPage.tsx`, `Settings.test.tsx` | modify | New label and description |
| `e2e/stub/redirect-metvuw.mjs` (+ test), `e2e/stub/metvuw-stub.mjs` | modify | Stub answers for `alerts.metservice.com` |
| `e2e/metservice-alerts.spec.ts` | create | End to end |

---

### Task 1: Read a CAP alert

**Files:**
- Create: `src/shared/helpers/warnings/parseCapAlert.ts`
- Test: `src/shared/helpers/warnings/parseCapAlert.test.ts`
- Commit also: the three fixtures already in `src/shared/helpers/warnings/fixtures/`

**Interfaces:**
- Produces: `AlertColour`, `AlertSeverity`, `Polygon`, `AlertArea`, `WeatherAlert`, `parseCapAlert(xml: string, now: Date): WeatherAlert[]` (all from `@/shared/helpers/warnings/parseCapAlert`).

- [ ] **Step 1: Check the fixtures are there**

```bash
ls src/shared/helpers/warnings/fixtures
grep -c "<Signature" src/shared/helpers/warnings/fixtures/*.xml
```

Expected: `atom.xml`, `road-snow-lewis-pass.xml`, `wind-hawkes-bay.xml`; the grep reports `0` for each (signatures were stripped). They are real MetService alerts from 30 Oct 2026, kept as fixtures: expired by now, so tests pass their own `now`.

- [ ] **Step 2: Write the failing test**

`src/shared/helpers/warnings/parseCapAlert.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { parseCapAlert } from './parseCapAlert'

const fixture = (name: string) =>
  readFileSync(join(__dirname, 'fixtures', name), 'utf8')
const wind = fixture('wind-hawkes-bay.xml')
const snow = fixture('road-snow-lewis-pass.xml')
// Before both alerts end (21:00 and 22:00 on 30 Oct 2026, New Zealand time).
const NOW = new Date('2026-10-30T00:00:00Z')

describe('parseCapAlert', () => {
  describe('a wind watch (Hawke\'s Bay, 30 Oct 2026)', () => {
    const alerts = parseCapAlert(wind, NOW)

    test('is one alert, with what the note shows', () => {
      expect(alerts).toHaveLength(1)
      expect(alerts[0]).toMatchObject({
        id: '2.49.0.0.554.0.severeweather.nz.20261029205033134.1',
        headline: 'Strong Wind Watch',
        event: 'wind',
        severity: 'Minor',
        colour: 'Yellow',
        colourHex: '#FFEB18',
        onsetUTC: 1793314800000,
        expiresUTC: 1793347200000,
        web: 'https://metservice.com/warnings/home',
      })
    })

    test('has its area, with the polygon rounded to 2 places and no repeated points', () => {
      expect(alerts[0].areas).toHaveLength(1)
      expect(alerts[0].areas[0].description).toBe(
        "Hawke's Bay south of Hastings and the Tararua District",
      )
      const [polygon] = alerts[0].areas[0].polygons
      expect(polygon).toHaveLength(187)
      expect(polygon[0]).toEqual([-40, 176.09])
    })
  })

  test('reads a road snow alert, which is orange', () => {
    const [alert] = parseCapAlert(snow, NOW)

    expect(alert).toMatchObject({
      headline: 'Road Snowfall Warning',
      event: 'snow',
      severity: 'Moderate',
      colour: 'Orange',
      colourHex: '#FF8918',
      onsetUTC: 1793332800000,
      expiresUTC: 1793350800000,
    })
    expect(alert.areas[0].polygons[0]).toHaveLength(162)
    expect(alert.areas[0].polygons[0][0]).toEqual([-42.34, 172.18])
  })

  describe('what is dropped', () => {
    test('a cancelled alert', () => {
      const cancelled = wind.replace(
        '<msgType>Update</msgType>',
        '<msgType>Cancel</msgType>',
      )

      expect(parseCapAlert(cancelled, NOW)).toEqual([])
    })

    test('a test alert', () => {
      const testAlert = wind.replace(
        '<status>Actual</status>',
        '<status>Test</status>',
      )

      expect(parseCapAlert(testAlert, NOW)).toEqual([])
    })

    test('an alert that is not public', () => {
      const hidden = wind.replace('<scope>Public</scope>', '<scope>Private</scope>')

      expect(parseCapAlert(hidden, NOW)).toEqual([])
    })

    test('an alert that has ended', () => {
      expect(parseCapAlert(wind, new Date('2026-10-30T09:00:00Z'))).toEqual([])
    })

    test('an alert with no polygon', () => {
      const noArea = wind.replace(/<polygon>[^<]*<\/polygon>/, '')

      expect(parseCapAlert(noArea, NOW)).toEqual([])
    })

    test('something that is not an alert', () => {
      expect(parseCapAlert('not xml', NOW)).toEqual([])
      expect(parseCapAlert('', NOW)).toEqual([])
    })
  })

  describe('what is made safe', () => {
    test('an alert with no colour code has no colour', () => {
      const plain = wind.replace(
        /<parameter><valueName>ColourCode(Hex)?<\/valueName><value>[^<]*<\/value><\/parameter>/g,
        '',
      )
      const [alert] = parseCapAlert(plain, NOW)

      expect(alert.colour).toBeUndefined()
      expect(alert.colourHex).toBeUndefined()
    })

    test('a colour that is not #rrggbb is dropped, not used in a style', () => {
      const odd = wind.replace('#FFEB18', 'red;background:url(x)')
      const [alert] = parseCapAlert(odd, NOW)

      expect(alert.colour).toBe('Yellow')
      expect(alert.colourHex).toBeUndefined()
    })

    test('a link to anywhere but MetService is replaced', () => {
      const foreign = wind.replace(
        '<web>https://metservice.com/warnings/home</web>',
        '<web>https://evil.example/x</web>',
      )
      const [alert] = parseCapAlert(foreign, NOW)

      expect(alert.web).toBe('https://www.metservice.com/warnings/home')
    })

    test('an alert with no start time starts when it was sent', () => {
      const noOnset = wind.replace(/<onset>[^<]*<\/onset>/, '')
      const [alert] = parseCapAlert(noOnset, NOW)

      expect(alert.onsetUTC).toBe(Date.parse('2026-10-30T09:50:33+13:00'))
    })
  })

  test('each info block is an alert of its own', () => {
    const info = /<info>.*<\/info>/s.exec(wind)?.[0] ?? ''
    const two = wind.replace('</alert>', `${info}</alert>`)

    const alerts = parseCapAlert(two, NOW)

    expect(alerts.map((alert) => alert.id)).toEqual([
      '2.49.0.0.554.0.severeweather.nz.20261029205033134.1',
      '2.49.0.0.554.0.severeweather.nz.20261029205033134.1#1',
    ])
  })
})
```

- [ ] **Step 3: Run it to see it fail**

Run: `npx vitest run src/shared/helpers/warnings/parseCapAlert.test.ts`
Expected: FAIL, "Failed to resolve import ./parseCapAlert".

- [ ] **Step 4: Write the parser**

`src/shared/helpers/warnings/parseCapAlert.ts`:

```ts
import * as cheerio from 'cheerio'

export type AlertColour = 'Red' | 'Orange' | 'Yellow'
export type AlertSeverity =
  'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown'

/** The corners of an area, as [latitude, longitude]. */
export type Polygon = [number, number][]

export interface AlertArea {
  description: string
  polygons: Polygon[]
}

/** What the note needs of one MetService watch, warning or advisory. */
export interface WeatherAlert {
  id: string
  /** As MetService titles it: "Strong Wind Watch". */
  headline: string
  /** CAP's kind of weather: "wind", "snow"... */
  event: string
  severity: AlertSeverity
  colour?: AlertColour
  /** MetService's colour for it, as #rrggbb. */
  colourHex?: string
  /** When it starts and ends (epoch ms). */
  onsetUTC: number
  expiresUTC: number
  /** Where to read it in full: always on metservice.com. */
  web: string
  areas: AlertArea[]
}

const COLOURS: readonly AlertColour[] = ['Red', 'Orange', 'Yellow']
const SEVERITIES = ['Extreme', 'Severe', 'Moderate', 'Minor'] as const
const FALLBACK_WEB = 'https://www.metservice.com/warnings/home'

/** Only MetService's own site: the address comes from outside. */
function isMetServiceUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'metservice.com' ||
        url.hostname.endsWith('.metservice.com'))
    )
  } catch {
    return false
  }
}

// About 1 km: enough to say which side of a coast or ridge a place is, and small
// enough to send to every visitor.
const round2 = (value: number) => Math.round(value * 100) / 100

/** "lat,lon lat,lon ...", rounded, with repeated points removed. */
function parsePolygon(text: string): Polygon {
  const points: Polygon = []
  for (const pair of text.trim().split(/\s+/)) {
    const [latitude, longitude] = pair.split(',').map(Number)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue
    const point: [number, number] = [round2(latitude), round2(longitude)]
    const last = points.at(-1)
    if (!last || last[0] !== point[0] || last[1] !== point[1]) {
      points.push(point)
    }
  }
  return points
}

/**
 * The alerts in one CAP 1.2 document (MetService's public feed), or none for one
 * that is cancelled, a test, not public, over, or has no area to place it. Each
 * `info` block is an alert of its own.
 */
export function parseCapAlert(xml: string, now: Date): WeatherAlert[] {
  const $ = cheerio.load(xml, { xml: true })
  const alert = $('alert').first()
  if (alert.children('status').text() !== 'Actual') return []
  if (alert.children('msgType').text() === 'Cancel') return []
  if (alert.children('scope').text() !== 'Public') return []
  const identifier = alert.children('identifier').text()
  if (!identifier) return []
  const sent = Date.parse(alert.children('sent').text())

  return alert
    .children('info')
    .toArray()
    .flatMap((element, index): WeatherAlert[] => {
      const info = $(element)
      const expiresUTC = Date.parse(info.children('expires').text())
      if (!Number.isFinite(expiresUTC) || expiresUTC <= now.getTime()) return []
      const onset = Date.parse(info.children('onset').text())
      const onsetUTC = Number.isFinite(onset) ? onset : sent
      if (!Number.isFinite(onsetUTC)) return []

      const areas = info
        .children('area')
        .toArray()
        .flatMap((area) => {
          const polygons = $(area)
            .children('polygon')
            .toArray()
            .map((polygon) => parsePolygon($(polygon).text()))
            .filter((polygon) => polygon.length >= 3)
          return polygons.length > 0
            ? [{ description: $(area).children('areaDesc').text(), polygons }]
            : []
        })
      if (areas.length === 0) return []

      const parameters = new Map(
        info
          .children('parameter')
          .toArray()
          .map((parameter) => [
            $(parameter).children('valueName').text(),
            $(parameter).children('value').text(),
          ]),
      )
      const hex = parameters.get('ColourCodeHex')
      const severity = info.children('severity').text()
      const web = info.children('web').text()

      return [
        {
          id: index === 0 ? identifier : `${identifier}#${index}`,
          headline: info.children('headline').text(),
          event: info.children('event').text(),
          severity: SEVERITIES.find((s) => s === severity) ?? 'Unknown',
          colour: COLOURS.find((c) => c === parameters.get('ColourCode')),
          colourHex: hex && /^#[0-9a-f]{6}$/i.test(hex) ? hex : undefined,
          onsetUTC,
          expiresUTC,
          web: isMetServiceUrl(web) ? web : FALLBACK_WEB,
          areas,
        },
      ]
    })
}
```

- [ ] **Step 5: Run the tests to see them pass**

Run: `npx vitest run src/shared/helpers/warnings/parseCapAlert.test.ts`
Expected: PASS, 14 tests. If the polygon length or first-point assertions differ, print the actual values and stop: they were computed from these exact fixtures.

- [ ] **Step 6: Lint, type check and commit**

```bash
npx eslint --fix src/shared/helpers/warnings
npx tsc --noEmit -p . 2>&1 | grep -v '^\.next' | grep -v '^  '
git add src/shared/helpers/warnings
git commit -m "feat: read a MetService CAP alert: its kind, colour, times, link and area"
```

Expected: `tsc` prints nothing. The commit message ends with the Co-Authored-By line from the constraints.

---

### Task 2: Fetch the alerts, and serve them

**Files:**
- Create: `src/shared/helpers/warnings/fetchWarnings.ts`, `src/app/api/warnings/route.ts`
- Test: `src/shared/helpers/warnings/fetchWarnings.test.ts`, `src/app/api/warnings/route.test.ts`

**Interfaces:**
- Consumes: `parseCapAlert`, `WeatherAlert` (Task 1).
- Produces: `fetchWarnings(now?: Date): Promise<WeatherAlert[]>` (throws if the feed fails); `GET /api/warnings` answering `{ alerts: WeatherAlert[] }`.

- [ ] **Step 1: Write the failing tests**

`src/shared/helpers/warnings/fetchWarnings.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { fetchWarnings } from './fetchWarnings'

const fixture = (name: string) =>
  readFileSync(join(__dirname, 'fixtures', name), 'utf8')
const atom = fixture('atom.xml')
const NOW = new Date('2026-10-30T00:00:00Z')
const WIND_ID = '2.49.0.0.554.0.severeweather.nz.20261029205033134.1'
const SNOW_ID = '2.49.0.0.554.0.roadsnow.lewispass.20261029212818927.0'
// The feed lists four alerts: two of them are here, the others answer 404.
const alertsById: Record<string, string> = {
  [WIND_ID]: fixture('wind-hawkes-bay.xml'),
  [SNOW_ID]: fixture('road-snow-lewis-pass.xml'),
}
const fetchMock = vi.fn()

const serve = (feed: () => Response = () => new Response(atom)) =>
  fetchMock.mockImplementation(async (url: string) => {
    const address = new URL(String(url))
    if (address.pathname === '/cap/atom') return feed()
    const body = alertsById[address.searchParams.get('id') ?? '']
    return body ? new Response(body) : new Response('no', { status: 404 })
  })

describe('fetchWarnings', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    serve()
  })
  afterEach(() => vi.unstubAllGlobals())

  test('reads the feed, then each alert it lists', async () => {
    const alerts = await fetchWarnings(NOW)

    expect(alerts.map((alert) => alert.id)).toEqual([WIND_ID, SNOW_ID])
    expect(fetchMock).toHaveBeenCalledTimes(5)
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://alerts.metservice.com/cap/atom',
    )
  })

  test('keeps each answer for 5 minutes, and gives up together after 8 s', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout')

    await fetchWarnings(NOW)

    expect(timeout).toHaveBeenCalledTimes(1)
    expect(timeout).toHaveBeenCalledWith(8_000)
    const signal = fetchMock.mock.calls[0][1].signal
    for (const [, options] of fetchMock.mock.calls) {
      expect(options.next).toEqual({ revalidate: 300 })
      expect(options.signal).toBe(signal)
    }
    timeout.mockRestore()
  })

  test('skips an alert that cannot be had, and keeps the rest', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      const address = new URL(String(url))
      if (address.pathname === '/cap/atom') return new Response(atom)
      if (address.searchParams.get('id') === WIND_ID) throw new Error('reset')
      return new Response(alertsById[address.searchParams.get('id') ?? ''] ?? '', {
        status: alertsById[address.searchParams.get('id') ?? ''] ? 200 : 404,
      })
    })

    const alerts = await fetchWarnings(NOW)

    expect(alerts.map((alert) => alert.id)).toEqual([SNOW_ID])
  })

  test('fails when the feed cannot be had', async () => {
    serve(() => new Response('busy', { status: 503 }))

    await expect(fetchWarnings(NOW)).rejects.toThrow('503')
  })

  test('does not follow a link to anywhere but MetService', async () => {
    serve(
      () =>
        new Response(
          atom.replaceAll(
            'https://alerts.metservice.com/cap/alert',
            'https://evil.example/cap/alert',
          ),
        ),
    )

    expect(await fetchWarnings(NOW)).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
```

`src/app/api/warnings/route.test.ts`:

```ts
import { fetchWarnings } from '@/shared/helpers/warnings/fetchWarnings'
import type { WeatherAlert } from '@/shared/helpers/warnings/parseCapAlert'

import { GET } from './route'

vi.mock('@/shared/helpers/warnings/fetchWarnings', () => ({
  fetchWarnings: vi.fn(),
}))

const alert: WeatherAlert = {
  id: 'a',
  headline: 'Strong Wind Watch',
  event: 'wind',
  severity: 'Minor',
  colour: 'Yellow',
  colourHex: '#FFEB18',
  onsetUTC: 1,
  expiresUTC: 2,
  web: 'https://metservice.com/warnings/home',
  areas: [{ description: 'Somewhere', polygons: [[[0, 0], [0, 1], [1, 0]]] }],
}

describe('GET /api/warnings', () => {
  beforeEach(() => vi.resetAllMocks())

  test('returns the alerts, kept 5 minutes by shared caches', async () => {
    vi.mocked(fetchWarnings).mockResolvedValue([alert])

    const response = await GET()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ alerts: [alert] })
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=300, stale-while-revalidate=300',
    )
  })

  test('returns an empty list when there are no alerts', async () => {
    vi.mocked(fetchWarnings).mockResolvedValue([])

    expect(await (await GET()).json()).toEqual({ alerts: [] })
  })

  test('returns 502, briefly cached, and says so in the log, when MetService cannot be had', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(fetchWarnings).mockRejectedValue(new Error('feed answered 503'))

    const response = await GET()

    expect(response.status).toBe(502)
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=30',
    )
    expect(warn).toHaveBeenCalledWith(
      '[warnings] MetService alerts unavailable: feed answered 503',
    )
    warn.mockRestore()
  })
})
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run src/shared/helpers/warnings/fetchWarnings.test.ts src/app/api/warnings`
Expected: FAIL, both fail to resolve their imports.

- [ ] **Step 3: Write the fetcher and the route**

`src/shared/helpers/warnings/fetchWarnings.ts`:

```ts
import * as cheerio from 'cheerio'

import { parseCapAlert, type WeatherAlert } from './parseCapAlert'

const FEED = 'https://alerts.metservice.com/cap/atom'
// Only alerts on MetService's own host are followed: the feed names them.
const ALERT_PREFIX = 'https://alerts.metservice.com/cap/alert?'
// The feed asks to be read every 5 minutes.
const REVALIDATE_SECONDS = 300
// The route may run 10 s: the feed and all its alerts share 8.
const TIMEOUT_MS = 8_000

/**
 * MetService's current alerts: the Atom feed, then each alert it links. An alert
 * that cannot be had is left out; the feed failing throws.
 */
export async function fetchWarnings(
  now: Date = new Date(),
): Promise<WeatherAlert[]> {
  const options = {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: REVALIDATE_SECONDS },
  }
  const feed = await fetch(FEED, options)
  if (!feed.ok) throw new Error(`feed answered ${feed.status}`)

  const $ = cheerio.load(await feed.text(), { xml: true })
  const links = $('entry > link[rel="related"]')
    .toArray()
    .map((link) => $(link).attr('href') ?? '')
    .filter((href) => href.startsWith(ALERT_PREFIX))

  const alerts = await Promise.all(
    links.map(async (link) => {
      try {
        const response = await fetch(link, options)
        return response.ok ? parseCapAlert(await response.text(), now) : []
      } catch {
        return []
      }
    }),
  )
  return alerts.flat()
}
```

`src/app/api/warnings/route.ts`:

```ts
import { NextResponse } from 'next/server'

import { UPSTREAM_ERROR_CACHE_CONTROL } from '@/shared/helpers/dataSource/imageCache'
import { fetchWarnings } from '@/shared/helpers/warnings/fetchWarnings'

// MetService updates its feed every few minutes: shared caches keep it as long.
const WARNINGS_CACHE_CONTROL =
  'public, max-age=0, s-maxage=300, stale-while-revalidate=300'

/**
 * MetService's current alerts, with their areas, for the browser to match to the
 * visitor's pins. The areas come here rather than the pins going there: pins stay
 * on the device. The feed does not allow other sites' browsers to read it.
 */
export async function GET() {
  try {
    const alerts = await fetchWarnings()
    return NextResponse.json(
      { alerts },
      { headers: { 'Cache-Control': WARNINGS_CACHE_CONTROL } },
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      `[warnings] MetService alerts unavailable: ${error instanceof Error ? error.message : 'error'}`,
    )
    return NextResponse.json(
      { ok: false, message: 'unable to fetch warnings' },
      {
        status: 502,
        headers: { 'Cache-Control': UPSTREAM_ERROR_CACHE_CONTROL },
      },
    )
  }
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `npx vitest run src/shared/helpers/warnings src/app/api/warnings`
Expected: PASS (14 parse tests, 5 fetch tests, 3 route tests). If the `502` header assertion fails, check the value of `UPSTREAM_ERROR_CACHE_CONTROL` in `src/shared/helpers/dataSource/imageCache.ts` and use it in the test instead of the literal.

- [ ] **Step 5: Lint, type check and commit**

```bash
npx eslint --fix src/shared/helpers/warnings src/app/api/warnings
npx tsc --noEmit -p . 2>&1 | grep -v '^\.next' | grep -v '^  '
git add src/shared/helpers/warnings src/app/api/warnings
git commit -m "feat: an API of MetService's current alerts, kept for 5 minutes"
```

---

### Task 3: Match pins to alerts

**Files:**
- Create: `src/shared/helpers/warnings/alertsForPins.ts`
- Test: `src/shared/helpers/warnings/alertsForPins.test.ts`

**Interfaces:**
- Consumes: `WeatherAlert`, `Polygon`, `AlertColour`, `AlertSeverity`, `parseCapAlert` (Task 1); `Pin` from `@/shared/helpers/pins/pins`.
- Produces: `PinAlert { alert: WeatherAlert; pins: Pin[]; upcoming: boolean }` and `alertsForPins(alerts: readonly WeatherAlert[], pins: readonly Pin[], now: number): PinAlert[]`.

- [ ] **Step 1: Write the failing test**

`src/shared/helpers/warnings/alertsForPins.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { Pin } from '@/shared/helpers/pins/pins'

import { alertsForPins } from './alertsForPins'
import { parseCapAlert } from './parseCapAlert'

const fixture = (name: string) =>
  readFileSync(join(__dirname, 'fixtures', name), 'utf8')
// Before either alert has started (the wind watch starts at 12:00 on 30 Oct, NZ).
const EARLY = Date.UTC(2026, 9, 29, 12)
const [wind] = parseCapAlert(fixture('wind-hawkes-bay.xml'), new Date(EARLY))
const [snow] = parseCapAlert(
  fixture('road-snow-lewis-pass.xml'),
  new Date(EARLY),
)

const pin = (name: string, latitude: number, longitude: number): Pin => ({
  id: name,
  name,
  context: 'New Zealand',
  kind: 'Town',
  latitude,
  longitude,
})
// Inside the wind watch's area (Tararua District, Hawke's Bay).
const dannevirke = pin('Dannevirke', -40.208, 176.102)
const waipukurau = pin('Waipukurau', -40.002, 176.557)
// Outside it.
const napier = pin('Napier', -39.49, 176.91)
// Inside the watch's bounding box, but outside its shape.
const cornerOfBox = pin('Corner', -39.7, 175.55)
// On the road corridor of the snow alert (a thin area).
const lewisPass = pin('Lewis Pass', -42.553, 172.352)

describe('alertsForPins', () => {
  test('finds the alert that covers a pin', () => {
    const found = alertsForPins([wind], [dannevirke], EARLY)

    expect(found).toHaveLength(1)
    expect(found[0].alert).toBe(wind)
    expect(found[0].pins).toEqual([dannevirke])
  })

  test('finds nothing for a pin outside the area', () => {
    expect(alertsForPins([wind], [napier], EARLY)).toEqual([])
  })

  test('tests the shape of the area, not only its bounding box', () => {
    expect(alertsForPins([wind], [cornerOfBox], EARLY)).toEqual([])
  })

  test('finds nothing without pins or alerts', () => {
    expect(alertsForPins([wind], [], EARLY)).toEqual([])
    expect(alertsForPins([], [dannevirke], EARLY)).toEqual([])
  })

  test('puts the pins an alert covers together, in the order they are given', () => {
    const found = alertsForPins(
      [wind],
      [waipukurau, napier, dannevirke],
      EARLY,
    )

    expect(found).toHaveLength(1)
    expect(found[0].pins).toEqual([waipukurau, dannevirke])
  })

  test('drops an alert that has ended', () => {
    const afterBoth = Date.UTC(2026, 9, 30, 10)

    expect(alertsForPins([wind, snow], [dannevirke, lewisPass], afterBoth)).toEqual(
      [],
    )
  })

  test('says whether an alert has yet to start', () => {
    const during = Date.UTC(2026, 9, 30, 1)

    expect(alertsForPins([wind], [dannevirke], EARLY)[0].upcoming).toBe(true)
    expect(alertsForPins([wind], [dannevirke], during)[0].upcoming).toBe(false)
  })

  test('puts the worst first: orange before yellow', () => {
    const found = alertsForPins([wind, snow], [dannevirke, lewisPass], EARLY)

    expect(found.map((f) => f.alert.colour)).toEqual(['Orange', 'Yellow'])
  })

  test('puts a more severe alert before a milder one of the same colour', () => {
    const milder = { ...wind, id: 'milder', severity: 'Minor' as const }
    const worse = { ...wind, id: 'worse', severity: 'Severe' as const }

    const found = alertsForPins([milder, worse], [dannevirke], EARLY)

    expect(found.map((f) => f.alert.id)).toEqual(['worse', 'milder'])
  })

  test('puts the one that starts first before another of the same kind', () => {
    const later = { ...wind, id: 'later', onsetUTC: wind.onsetUTC + 1000 }
    const sooner = { ...wind, id: 'sooner' }

    const found = alertsForPins([later, sooner], [dannevirke], EARLY)

    expect(found.map((f) => f.alert.id)).toEqual(['sooner', 'later'])
  })

  test('puts an alert with no colour after the coloured ones', () => {
    const plain = { ...snow, id: 'plain', colour: undefined }

    const found = alertsForPins([plain, wind], [dannevirke, lewisPass], EARLY)

    expect(found.map((f) => f.alert.id)).toEqual([wind.id, 'plain'])
  })
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/shared/helpers/warnings/alertsForPins.test.ts`
Expected: FAIL, "Failed to resolve import ./alertsForPins".

- [ ] **Step 3: Write the matching**

`src/shared/helpers/warnings/alertsForPins.ts`:

```ts
import type { Pin } from '@/shared/helpers/pins/pins'

import type {
  AlertColour,
  AlertSeverity,
  Polygon,
  WeatherAlert,
} from './parseCapAlert'

/** An alert, with the visitor's pins inside its area. */
export interface PinAlert {
  alert: WeatherAlert
  pins: Pin[]
  /** Not yet started: the note says when it will, not when it ends. */
  upcoming: boolean
}

const COLOUR_RANK: Record<AlertColour, number> = {
  Red: 3,
  Orange: 2,
  Yellow: 1,
}
const SEVERITY_RANK: Record<AlertSeverity, number> = {
  Extreme: 4,
  Severe: 3,
  Moderate: 2,
  Minor: 1,
  Unknown: 0,
}

/** Whether a place is inside a polygon of [latitude, longitude] corners (ray casting). */
function inPolygon(latitude: number, longitude: number, polygon: Polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lonI] = polygon[i]
    const [latJ, lonJ] = polygon[j]
    if (
      latI > latitude !== latJ > latitude &&
      longitude < ((lonJ - lonI) * (latitude - latI)) / (latJ - latI) + lonI
    ) {
      inside = !inside
    }
  }
  return inside
}

const worstFirst = (a: PinAlert, b: PinAlert) =>
  (b.alert.colour ? COLOUR_RANK[b.alert.colour] : 0) -
    (a.alert.colour ? COLOUR_RANK[a.alert.colour] : 0) ||
  SEVERITY_RANK[b.alert.severity] - SEVERITY_RANK[a.alert.severity] ||
  a.alert.onsetUTC - b.alert.onsetUTC

/**
 * The alerts that cover any of the pins, and which pins they cover: ones that
 * have not ended, worst first. Done in the browser, so the pins stay on the
 * device.
 */
export function alertsForPins(
  alerts: readonly WeatherAlert[],
  pins: readonly Pin[],
  now: number,
): PinAlert[] {
  return alerts
    .filter((alert) => alert.expiresUTC > now)
    .flatMap((alert) => {
      const inside = pins.filter((pin) =>
        alert.areas.some((area) =>
          area.polygons.some((polygon) =>
            inPolygon(pin.latitude, pin.longitude, polygon),
          ),
        ),
      )
      return inside.length > 0
        ? [{ alert, pins: inside, upcoming: alert.onsetUTC > now }]
        : []
    })
    .sort(worstFirst)
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `npx vitest run src/shared/helpers/warnings/alertsForPins.test.ts`
Expected: PASS, 11 tests. The pins were checked against these exact fixtures with this same algorithm.

- [ ] **Step 5: Lint, type check and commit**

```bash
npx eslint --fix src/shared/helpers/warnings
npx tsc --noEmit -p . 2>&1 | grep -v '^\.next' | grep -v '^  '
git add src/shared/helpers/warnings
git commit -m "feat: match a visitor's pins to MetService alert areas, worst first"
```

---

### Task 4: Fetch in the browser, and share it with the page

**Files:**
- Create: `src/components/RainStrip/useWeatherAlerts.ts`
- Test: `src/components/RainStrip/useWeatherAlerts.test.tsx`
- Modify: `src/components/RainStrip/RainWatch.tsx`

**Interfaces:**
- Consumes: `WeatherAlert` (Task 1); `alertsForPins`, `PinAlert` (Task 3).
- Produces: `useWeatherAlerts(enabled: boolean): readonly WeatherAlert[]`; `RainWatch` (the context value from `useRainWatch()`) gains `alerts: readonly PinAlert[]`.

- [ ] **Step 1: Write the failing test**

`src/components/RainStrip/useWeatherAlerts.test.tsx`:

```tsx
import { renderHook, waitFor } from '@testing-library/react'

import type { WeatherAlert } from '@/shared/helpers/warnings/parseCapAlert'

import { useWeatherAlerts } from './useWeatherAlerts'

const alert: WeatherAlert = {
  id: 'a',
  headline: 'Strong Wind Watch',
  event: 'wind',
  severity: 'Minor',
  onsetUTC: 1,
  expiresUTC: 2,
  web: 'https://metservice.com/warnings/home',
  areas: [{ description: 'Somewhere', polygons: [[[0, 0], [0, 1], [1, 0]]] }],
}
const fetchMock = vi.fn()

describe('useWeatherAlerts', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  test('fetches the alerts once, when it is enabled', async () => {
    fetchMock.mockResolvedValue(Response.json({ alerts: [alert] }))

    const { result, rerender } = renderHook(
      ({ enabled }) => useWeatherAlerts(enabled),
      { initialProps: { enabled: true } },
    )
    await waitFor(() => expect(result.current).toEqual([alert]))
    rerender({ enabled: true })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/warnings')
  })

  test('does not ask while it is not enabled', () => {
    renderHook(() => useWeatherAlerts(false))

    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('has no alerts when the request fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))

    const { result } = renderHook(() => useWeatherAlerts(true))
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    expect(result.current).toEqual([])
  })

  test('has no alerts when the answer is an error', async () => {
    fetchMock.mockResolvedValue(Response.json({ ok: false }, { status: 502 }))

    const { result } = renderHook(() => useWeatherAlerts(true))
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    expect(result.current).toEqual([])
  })

  test('has no alerts when the answer is not a list of them', async () => {
    fetchMock.mockResolvedValue(Response.json({ alerts: 'soon' }))

    const { result } = renderHook(() => useWeatherAlerts(true))
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    expect(result.current).toEqual([])
  })
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/components/RainStrip/useWeatherAlerts.test.tsx`
Expected: FAIL, "Failed to resolve import ./useWeatherAlerts".

- [ ] **Step 3: Write the hook**

`src/components/RainStrip/useWeatherAlerts.ts`:

```ts
'use client'
import { useEffect, useState } from 'react'

import type { WeatherAlert } from '@/shared/helpers/warnings/parseCapAlert'

/**
 * MetService's current alerts, fetched once when `enabled` first holds (the
 * visitor has pins and warnings on). Nothing while it is not, and nothing if the
 * request fails: the note then shows only what the charts say.
 */
export function useWeatherAlerts(enabled: boolean): readonly WeatherAlert[] {
  const [alerts, setAlerts] = useState<readonly WeatherAlert[]>([])

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    fetch('/api/warnings', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : undefined))
      .then((body) => {
        if (Array.isArray(body?.alerts)) setAlerts(body.alerts)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [enabled])

  return alerts
}
```

- [ ] **Step 4: Run it to see it pass**

Run: `npx vitest run src/components/RainStrip/useWeatherAlerts.test.tsx`
Expected: PASS, 5 tests, no warnings in the output.

- [ ] **Step 5: Put the matched alerts in the page's rain watch**

In `src/components/RainStrip/RainWatch.tsx`:

1. Add the imports below the existing ones (keep the import order ESLint wants):

```ts
import { alertsForPins, type PinAlert } from '@/shared/helpers/warnings/alertsForPins'

import { useWeatherAlerts } from './useWeatherAlerts'
```

2. Add to the `RainWatch` interface, after `checked`:

```ts
  /** MetService alerts covering the visitor's pins, worst first. */
  alerts: readonly PinAlert[]
```

3. In `RainWatchProvider`, after `const showHeavyRain = useAtomValue(showHeavyRainAtom)`, add:

```ts
  // Fetched at page load, in step with the charts being read; matched below.
  const alerts = useWeatherAlerts(showHeavyRain && pins.length > 0)
```

4. In the `useMemo` body, add `alerts: watching && now !== 0 ? alertsForPins(alerts, pins, now) : [],` to the returned object (after `checked: ...`), and add `alerts` to the dependency array.

5. Add `alerts: [],` to the `NOTHING` constant.

- [ ] **Step 6: Run the unit suite, type check, lint, commit**

```bash
npx vitest run 2>&1 | grep -E "Test Files|Tests  |×"
npx tsc --noEmit -p . 2>&1 | grep -v '^\.next' | grep -v '^  '
npx eslint --fix src/components/RainStrip
git add src/components/RainStrip
git commit -m "feat: the page's rain watch carries the MetService alerts that cover the visitor's pins"
```

Expected: every test file passes; `tsc` prints nothing.

---

### Task 5: Show the alerts

**Files:**
- Create: `src/components/RainStrip/band.ts`, `src/components/RainStrip/AlertLines.tsx`
- Test: `src/components/RainStrip/AlertLines.test.tsx`
- Modify: `src/components/RainStrip/HeavyRainNote.tsx`, `src/components/Settings/SettingsPage.tsx`, `src/components/Settings/Settings.test.tsx`

**Interfaces:**
- Consumes: `PinAlert` (Task 3); `useRainWatch().alerts` (Task 4); `chartLabel` from `@/shared/helpers/pins/pins`; `useFormatDate` from `@/components/Hooks/useFormatDate`.
- Produces: `AlertLines({ alerts }: { alerts: readonly PinAlert[] })`; `HeavyRainNote` gains an optional `alerts?: readonly PinAlert[]` prop (default `[]`).

- [ ] **Step 1: Write the failing test for the lines**

`src/components/RainStrip/AlertLines.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react'

import type { Pin } from '@/shared/helpers/pins/pins'
import type { PinAlert } from '@/shared/helpers/warnings/alertsForPins'
import type { WeatherAlert } from '@/shared/helpers/warnings/parseCapAlert'

import { AlertLines } from './AlertLines'

const pin = (name: string): Pin => ({
  id: name,
  name,
  context: 'New Zealand',
  kind: 'Town',
  latitude: 0,
  longitude: 0,
})
const alert = (extra: Partial<WeatherAlert> = {}): WeatherAlert => ({
  id: 'a',
  headline: 'Strong Wind Watch',
  event: 'wind',
  severity: 'Minor',
  colour: 'Yellow',
  colourHex: '#FFEB18',
  // 12:00 and 21:00 on Fri 30 Oct 2026, New Zealand time.
  onsetUTC: Date.UTC(2026, 9, 29, 23),
  expiresUTC: Date.UTC(2026, 9, 30, 8),
  web: 'https://metservice.com/warnings/home',
  areas: [],
  ...extra,
})
const covering = (
  pins: string[],
  extra: Partial<WeatherAlert> = {},
  upcoming = false,
): PinAlert => ({ alert: alert(extra), pins: pins.map(pin), upcoming })
const region = () => screen.getByRole('region', { name: 'Weather alerts' })

describe('<AlertLines />', () => {
  test('shows nothing without alerts', () => {
    const { container } = render(<AlertLines alerts={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  test('says what, where and until when, linked to MetService, in a new tab', () => {
    render(<AlertLines alerts={[covering(['Wanaka'])]} />)

    const link = within(region()).getByRole('link', {
      name: /Strong Wind Watch at Wanaka: until/,
    })
    expect(link).toHaveAttribute('href', 'https://metservice.com/warnings/home')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link.textContent).toMatch(
      /^Strong Wind Watch at Wanaka: until [A-Z][a-z]{2} \\d{1,2}:\\d{2}(am|pm)$/,
    )
  })

  test('says when an alert that has not started will', () => {
    render(<AlertLines alerts={[covering(['Wanaka'], {}, true)]} />)

    expect(within(region()).getByRole('link').textContent).toMatch(
      /^Strong Wind Watch at Wanaka: from [A-Z][a-z]{2} \\d{1,2}:\\d{2}(am|pm)$/,
    )
  })

  test.each([
    [['A'], 'A'],
    [['A', 'B'], 'A and B'],
    [['A', 'B', 'C'], 'A, B and C'],
  ])('names the places %j as %s', (names, expected) => {
    render(<AlertLines alerts={[covering(names)]} />)

    expect(within(region()).getByRole('link').textContent).toContain(
      `Strong Wind Watch at ${expected}:`,
    )
  })

  test('names a pin as the charts do: by its label when it has one', () => {
    const labelled = { ...pin('Wanaka'), label: 'The bach' }
    render(
      <AlertLines alerts={[{ alert: alert(), pins: [labelled], upcoming: false }]} />,
    )

    expect(within(region()).getByRole('link').textContent).toContain(
      'at The bach:',
    )
  })

  test("edges each line in MetService's colour, or the neutral edge without one", () => {
    render(
      <AlertLines
        alerts={[
          covering(['A']),
          covering(['B'], { colour: undefined, colourHex: undefined }),
        ]}
      />,
    )

    const [coloured, plain] = within(region()).getAllByRole('listitem')
    expect(coloured).toHaveStyle({ borderColor: '#FFEB18' })
    expect(plain.getAttribute('style') ?? '').not.toContain('border-color')
  })

  test('shows three lines, then says how many more', () => {
    render(
      <AlertLines
        alerts={['A', 'B', 'C', 'D', 'E'].map((name) =>
          covering([name], { id: name, headline: `Alert ${name}` }),
        )}
      />,
    )

    expect(within(region()).getAllByRole('link')).toHaveLength(3)
    expect(region()).toHaveTextContent('and 2 more')
  })

  test('credits MetService and the licence, and says the areas are simplified', () => {
    render(<AlertLines alerts={[covering(['Wanaka'])]} />)

    expect(region()).toHaveTextContent(
      'Alerts from MetService, licensed CC BY 4.0; areas simplified.',
    )
    expect(within(region()).getByRole('link', { name: 'MetService' })).toHaveAttribute(
      'href',
      'https://www.metservice.com',
    )
    expect(within(region()).getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute(
      'href',
      'https://creativecommons.org/licenses/by/4.0/',
    )
  })
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/components/RainStrip/AlertLines.test.tsx`
Expected: FAIL, "Failed to resolve import ./AlertLines".

- [ ] **Step 3: Write the shared band constants and the lines**

`src/components/RainStrip/band.ts`:

```ts
/** How the heavy rain band's lines are laid out. */
export const band =
  'flex min-h-11 items-center gap-3 border-l-4 bg-plate px-3 py-2.5 text-sm leading-snug'

/** Lines shown before "and N more". */
export const MOST_SHOWN = 3
```

`src/components/RainStrip/AlertLines.tsx`:

```tsx
'use client'
import { useFormatDate } from '@/components/Hooks/useFormatDate'
import { chartLabel } from '@/shared/helpers/pins/pins'
import type { PinAlert } from '@/shared/helpers/warnings/alertsForPins'

import { MOST_SHOWN } from './band'

/** "A", "A and B", "A, B and C". */
const joinNames = (names: string[]) =>
  names.length < 2
    ? names.join('')
    : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`

/**
 * MetService's alerts for the visitor's pins, worst first, each a link to the
 * alert on MetService's site: they are official, so they come above what the
 * charts say. Shows nothing without alerts.
 */
export function AlertLines({ alerts }: { alerts: readonly PinAlert[] }) {
  const formatDate = useFormatDate()
  if (alerts.length === 0) return null

  const shown = alerts.slice(0, MOST_SHOWN)
  const more = alerts.length - shown.length
  const when = (time: number) => formatDate(time, 'EEE h:mmaaa')

  return (
    <section
      aria-label="Weather alerts"
      className="bg-plate mb-2 px-3 py-2.5 text-sm leading-snug"
    >
      <ul className="space-y-1.5">
        {shown.map(({ alert, pins, upcoming }) => (
          <li
            key={alert.id}
            // Where MetService gives a colour, its own: validated as #rrggbb when read.
            style={alert.colourHex ? { borderColor: alert.colourHex } : undefined}
            className={`border-l-4 pl-2 ${alert.colourHex ? '' : 'border-rule'}`}
          >
            <a
              href={alert.web}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink focus-visible:outline-cold rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <strong className="font-semibold">
                {alert.headline} at {joinNames(pins.map(chartLabel))}:
              </strong>{' '}
              <span className="underline underline-offset-2">
                {upcoming
                  ? `from ${when(alert.onsetUTC)}`
                  : `until ${when(alert.expiresUTC)}`}
              </span>
            </a>
          </li>
        ))}
        {more > 0 && <li className="text-ink-soft">and {more} more</li>}
      </ul>
      <p className="text-ink-soft mt-2 text-xs">
        Alerts from{' '}
        <a
          href="https://www.metservice.com"
          className="underline underline-offset-2"
        >
          MetService
        </a>
        , licensed{' '}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          className="underline underline-offset-2"
        >
          CC BY 4.0
        </a>
        ; areas simplified.
      </p>
    </section>
  )
}
```

- [ ] **Step 4: Run it to see it pass**

Run: `npx vitest run src/components/RainStrip/AlertLines.test.tsx`
Expected: PASS, 10 tests. If the `until`/`from` regex fails, print `link.textContent` and compare with the `EEE h:mmaaa` output in `HeavyRainNote`'s own tests (e.g. `Thu 7:00pm`): the format string is the same.

- [ ] **Step 5: Add the lines to the heavy rain note, and use the shared constants**

In `src/components/RainStrip/HeavyRainNote.tsx`:

1. Remove the local `const MOST_SHOWN = 3` and the local `const band = ...` (the multi-line string), and import them: `import { band, MOST_SHOWN } from './band'`.
2. Add the imports `import type { PinAlert } from '@/shared/helpers/warnings/alertsForPins'` and `import { AlertLines } from './AlertLines'` (in ESLint's import order).
3. Add `alerts = [],` to the destructured props of `HeavyRainNote` (after `onSeek`), and `alerts?: readonly PinAlert[]` to its prop types, documented: `/** MetService alerts for the pins, shown above what the charts say. */`.
4. In the returned fragment, as its first child, before `{showing ? (`, add `<AlertLines alerts={alerts} />`.
5. In `HeavyRainSlot`: `const { heavyRain, watching, checked, alerts } = useRainWatch()` and pass `alerts={alerts}` to `<HeavyRainNote ... />`.
6. Update the component's doc comment: add "MetService's alerts for those pins come first, above these lines."

Then check nothing else broke:

```bash
npx vitest run src/components/RainStrip 2>&1 | grep -E "Test Files|Tests  |×"
```

Expected: all pass (the existing note tests pass no alerts, which default to none).

- [ ] **Step 6: Rename the Settings switch, test first**

In `src/components/Settings/Settings.test.tsx`, in the `warnings` describe, change the test to:

```tsx
    test('has weather warnings on until they are turned off, and counts it', () => {
      const { store } = renderPage()
      const toggle = screen.getByRole('switch', {
        name: 'Show weather warnings',
      })
```

(the rest of the test is unchanged). Run `npx vitest run src/components/Settings/Settings.test.tsx` and see that test fail (no switch with that name). Then in `src/components/Settings/SettingsPage.tsx` change the `ToggleRow`'s props:

```tsx
          label="Show weather warnings"
          description="Notes at the top of a chart page: official MetService alerts for a place you have added, and heavy rain the charts show ahead there."
```

Run the same test again: PASS.

- [ ] **Step 7: Full unit suite, type check, lint, commit**

```bash
npx eslint --fix src/components
npx vitest run 2>&1 | grep -E "Test Files|Tests  |×"
npx tsc --noEmit -p . 2>&1 | grep -v '^\.next' | grep -v '^  '
git add src/components
git commit -m "feat: MetService alerts for a visitor's places, above the heavy rain heads-up, under one weather warnings switch"
```

Expected: everything passes; `tsc` prints nothing.

---

### Task 6: End to end, with MetService stubbed

**Files:**
- Modify: `e2e/stub/redirect-metvuw.mjs`, `e2e/stub/redirect-metvuw.test.mjs`, `e2e/stub/metvuw-stub.mjs`
- Create: `e2e/metservice-alerts.spec.ts`

**Interfaces:**
- Consumes: the whole feature.
- Produces: the stub answers `GET /cap/atom` (one entry) and `GET /cap/alert?id=stub-wind-christchurch` (a wind watch around Christchurch, ending in 2099), for the app's server fetches of `alerts.metservice.com`.

- [ ] **Step 1: Write the failing redirect test**

Add to the `describe('redirectMetvuw', ...)` block in `e2e/stub/redirect-metvuw.test.mjs`:

```js
  test('sends MetService alerts to the stub too', async () => {
    const { calls, fetch } = setup()

    await fetch('https://alerts.metservice.com/cap/atom')

    expect(requestedUrl(calls[0])).toBe(`${STUB}/cap/atom`)
  })
```

Run: `npx vitest run e2e/stub/redirect-metvuw.test.mjs`. Expected: FAIL (the URL is unchanged).

- [ ] **Step 2: Redirect MetService too**

In `e2e/stub/redirect-metvuw.mjs`, change the `STUBBED_HOSTS` set to:

```js
const STUBBED_HOSTS = new Set([
  'metvuw.com',
  'weather.uwyo.edu',
  'alerts.metservice.com',
])
```

and add ", and of MetService's alerts" to the first sentence of the file's top comment (after "the University of Wyoming's balloon data"). Run `npx vitest run e2e/stub/redirect-metvuw.test.mjs`: PASS.

- [ ] **Step 3: Answer for MetService in the stub**

In `e2e/stub/metvuw-stub.mjs`, below the `SOUNDINGS` constant add:

```js
// MetService's alert feed. One wind watch covers Christchurch (and nowhere the
// other e2e specs put a pin), until 2099, so the page always has it.
const ALERT_ID = 'stub-wind-christchurch'
const ALERT_FEED = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>https://alerts.metservice.com/cap/atom</id>
  <title>Current Watches, Warnings and Advisories for New Zealand issued by MetService</title>
  <entry>
    <title>Strong Wind Watch</title>
    <id>${ALERT_ID}</id>
    <link rel="related" type="application/cap+xml" href="https://alerts.metservice.com/cap/alert?id=${ALERT_ID}"/>
  </entry>
</feed>`
const ALERT = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2"><identifier>${ALERT_ID}</identifier><sender>https://www.metservice.com</sender><sent>2026-10-01T00:00:00+13:00</sent><status>Actual</status><msgType>Alert</msgType><scope>Public</scope><info><category>Met</category><event>wind</event><severity>Moderate</severity><onset>2026-10-01T00:00:00+13:00</onset><expires>2099-01-01T00:00:00+13:00</expires><headline>Strong Wind Watch</headline><web>https://metservice.com/warnings/home</web><parameter><valueName>ColourCode</valueName><value>Orange</value></parameter><parameter><valueName>ColourCodeHex</valueName><value>#FF8918</value></parameter><area><areaDesc>Christchurch</areaDesc><polygon>-43.70,172.40 -43.70,172.90 -43.40,172.90 -43.40,172.40 -43.70,172.40</polygon></area></info></alert>`
```

and add these two entries to the `pages` object:

```js
  '/cap/atom': () => ({ body: ALERT_FEED }),
  '/cap/alert': (query) =>
    query.get('id') === ALERT_ID
      ? { body: ALERT }
      : { status: 404, body: 'Not found' },
```

- [ ] **Step 4: Write the end-to-end spec**

`e2e/metservice-alerts.spec.ts`:

```ts
import { expect, type Page, test } from '@playwright/test'

// MetService's alerts for a pin, above the heavy rain heads-up. The stub has one
// wind watch, around Christchurch (see e2e/stub/metvuw-stub.mjs).
const christchurch = {
  name: 'Christchurch',
  context: 'Canterbury',
  kind: 'City',
  latitude: -43.532,
  longitude: 172.637,
}
const auckland = {
  name: 'Auckland',
  context: 'Auckland',
  kind: 'City',
  latitude: -36.848,
  longitude: 174.763,
}

async function pin(page: Page, ...pins: object[]) {
  await page.addInitScript(
    (value) => localStorage.setItem('pins', JSON.stringify(value)),
    pins,
  )
}
const alerts = (page: Page) =>
  page.getByRole('region', { name: 'Weather alerts' })

test.describe('MetService alerts for a pin', () => {
  test('shows the alert for a pin inside its area, linked to MetService @mobile', async ({
    page,
  }) => {
    await pin(page, christchurch)

    await page.goto('/regions/nz')

    await expect(alerts(page)).toBeVisible()
    const link = alerts(page).getByRole('link', {
      name: /Strong Wind Watch at Christchurch: until/,
    })
    await expect(link).toHaveAttribute(
      'href',
      'https://metservice.com/warnings/home',
    )
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(alerts(page)).toContainText(
      'Alerts from MetService, licensed CC BY 4.0; areas simplified.',
    )
  })

  test('shows the alert above what the charts say', async ({ page }) => {
    await pin(page, christchurch)

    await page.goto('/regions/nz')

    const slot = page.locator('[data-heavy-rain-slot]')
    await expect(alerts(page)).toBeVisible()
    const alertsTop = (await alerts(page).boundingBox())!.y
    const rainTop = (await slot.getByRole('status').boundingBox())!.y
    expect(alertsTop).toBeLessThan(rainTop)
  })

  test('shows no alert for a pin outside its area', async ({ page }) => {
    await pin(page, auckland)

    await page.goto('/regions/nz')

    await expect(page.locator('[data-heavy-rain-slot]')).toBeVisible()
    await expect(alerts(page)).toHaveCount(0)
  })

  test('shows no alert when weather warnings are off in Settings', async ({
    page,
  }) => {
    await pin(page, christchurch)
    await page.addInitScript(() =>
      localStorage.setItem('showHeavyRain', 'false'),
    )

    await page.goto('/regions/nz')
    await page.waitForSelector('main img')

    await expect(alerts(page)).toHaveCount(0)
    await expect(page.locator('[data-heavy-rain-slot]')).toBeHidden()
  })

  test('asks the server for the alerts, not MetService, and sends it nothing of the pins', async ({
    page,
  }) => {
    const requests: string[] = []
    page.on('request', (request) => requests.push(request.url()))
    await pin(page, christchurch)

    await page.goto('/regions/nz')
    await expect(alerts(page)).toBeVisible()

    const asked = requests.filter((url) =>
      /\/api\/warnings|metservice\.com/.test(url),
    )
    expect(asked).toEqual([expect.stringMatching(/\/api\/warnings$/)])
  })
})
```

- [ ] **Step 5: Build with the stub and run**

```bash
npm run e2e:build > /tmp/e2e-build.log 2>&1 && npx playwright test e2e/metservice-alerts.spec.ts e2e/heavy-rain.spec.ts e2e/rain-strip.spec.ts e2e/accessibility.spec.ts e2e/settings.spec.ts --project=chromium --project="Mobile Chrome" --reporter=line
```

Expected: all pass, including the existing heavy rain spec, whose pins (Wanaka, Auckland) are outside the stub alert, so it is unchanged. If `e2e/settings.spec.ts` does not exist, drop it from the command. If the build fails, read the end of `/tmp/e2e-build.log`. Local Firefox cannot reach the app on this machine; CI runs it.

- [ ] **Step 6: Commit**

```bash
npx eslint --fix e2e
git add e2e
git commit -m "test: end to end checks of MetService alerts on a pin, with the feed stubbed"
```

---

### Task 7: The whole suite, and the live feed

**Files:** none changed unless a check fails.

- [ ] **Step 1: Run everything CI runs**

```bash
npx eslint .
npx tsc --noEmit -p . 2>&1 | grep -v '^\.next' | grep -v '^  '
npx vitest run 2>&1 | grep -E 'Test Files|Tests  '
npx playwright test --project=chromium --project="Mobile Chrome" --project=webkit --reporter=line 2>&1 | tail -5
```

Expected: ESLint and `tsc` print nothing; Vitest passes every file; Playwright reports no failures (a few known-flaky tests in `footer-on-scroll`, `rain-strip` and `feature-events` may need a re-run: confirm they pass alone before blaming this change).

- [ ] **Step 2: Try it against the real feed**

Run the app locally (`npm run dev`), open `http://localhost:3002/api/warnings` in a browser, and check it returns `{ "alerts": [...] }` with whatever MetService has active (it may be empty on a quiet day; compare with https://alerts.metservice.com/cap/atom). If an alert is active, add a pin inside its area on the Pins page and open the New Zealand forecast: the alert line should show above the rain lines.

Do not call `alerts.metservice.com` from tests or scripts in a loop: one request per check is plenty.
