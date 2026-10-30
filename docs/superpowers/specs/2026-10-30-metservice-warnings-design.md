# MetService warnings for pinned places

Approved in brainstorming on 2026-10-30. This is step 2 of #2613: official MetService watches, warnings and advisories, shown for a visitor's pins in the band that already holds the chart-based heavy rain heads-up.

## Why

The heavy rain note says what metvuw's charts show at a pin, and says plainly it is not a MetService warning. MetService publishes its real alerts as a public CAP feed (Creative Commons BY 4.0). A visitor who has pinned a hut or a town should see the official alert for it, ahead of our own reading.

## What a visitor sees

On region forecast pages, wherever the band at the top (`HeavyRainSlot`) shows (warnings switched on, and a pin on the page's chart), it gets alert lines **above** the existing heavy rain lines. Alerts are matched against all the visitor's pins:

- **One line per alert,** with the pins inside its area and when it ends: "Strong Wind Watch at Wanaka: until Fri 9:00pm". An alert that has not started says "from Fri 12:00pm". Pins are named as the charts name them (`chartLabel`): "at A", "at A and B", "at A, B and C".
- **A coloured edge** from MetService's colour code (yellow, orange, red; hexes come in the feed). An alert with no colour code has the neutral edge (every alert seen so far has one: the road snow alerts are orange).
- **Up to three lines, then "and N more".** Worst first: by colour (red, orange, yellow, none), then CAP severity (Extreme, Severe, Moderate, Minor), then earliest start.
- **Each line has two actions.** "Map for Fri 12:00pm" is a button that shows the forecast chart nearest the alert's time: its start for an alert yet to begin, or now for one under way (clamped to the first and last chart), and scrolls to it, as tapping a heavy rain line does. "On MetService" is a link to the alert's own `web` address (MetService's warnings page), opened in a new tab. The note does not repeat the alert text. The map button is left out when the page has no charts.
- **A credit line:** "Alerts from MetService, licensed CC BY 4.0; areas simplified", with MetService and the licence linked. The licence requires the credit, a link to the licence and a note of changes.
- **The chart-based lines follow unchanged,** with their own line "From metvuw's forecast charts, not a MetService warning".
- **Pins outside New Zealand never match;** no message is shown for them.
- **If MetService can't be reached,** the band is exactly as before.
- **One Settings switch covers the whole band.** "Show heavy rain warnings" becomes "Show weather warnings", described as "Notes at the top of a chart page: official MetService alerts for a place you have added, and heavy rain the charts show ahead there." The analytics setting name stays `heavy_rain`.

All types of alert show (wind, rain, snow, thunderstorm, road snow, and the rest), not only rain.

## Data

- **Feed:** `https://alerts.metservice.com/cap/atom` lists the current alerts; each entry links to its CAP XML (`https://alerts.metservice.com/cap/alert?id=...`). The feed's own cache lifetime is 300 s. Its CORS header allows only `about.metservice.com`, so the browser cannot call it: our server does.
- **Fields kept** from each alert (CAP 1.2, namespace `urn:oasis:names:tc:emergency:cap:1.2`): `identifier`, `info/event`, `info/headline`, `info/severity`, `info/onset` (falling back to `sent`), `info/expires`, `info/web`, the parameter `ColourCode` and `ColourCodeHex`, and every `info/area` with its `areaDesc` and `polygon`s. An alert may have several `info` blocks and several areas: each `info` block becomes its own alert (its id is the identifier, with `#1`, `#2` for later blocks) and all its areas are read.
- **Dropped:** `status` other than `Actual`, `msgType` of `Cancel`, `scope` other than `Public`, anything whose `expires` has passed, and any area with no polygon (every alert seen so far has one).
- **Polygons** are `lat,lon lat,lon ...`. They are rounded to 2 decimal places (about 1 km), which moves an edge by up to about 1 km, and consecutive duplicate points are removed. The credit says "areas simplified".
- **Seen on 2026-10-30:** 4 alerts (2 wind watches, 2 road snow), 124–246 polygon points each, about 7 KB of XML each, so the JSON is well under 20 KB even in a bad storm.

## How it works

All matching is in the browser, so pins never leave the device.

1. **`GET /api/warnings`** (server) returns `{ alerts: Alert[] }`, cached `public, max-age=0, s-maxage=300, stale-while-revalidate=300`. When MetService fails it answers 502 with the existing short upstream-error cache header (`UPSTREAM_ERROR_CACHE_CONTROL`).
2. **`useWeatherAlerts()`** (client) fetches it once per page, at page load, only when there are pins on the page and the setting is on. A failed fetch is no alerts.
3. **`alertsForPins(alerts, pins, now)`** (pure) tests each pin against each alert's polygons (ray casting), drops expired alerts, groups the pins inside each alert, and sorts worst first.
4. **`RainWatchProvider`** puts the matched alerts in its context beside the heavy rain results; **`HeavyRainNote`** renders them with `AlertLines`.

**Layout shift (accepted).** Alerts arrive after the page has loaded, so a visitor with an alert at one of their pins sees the band grow once: about a third of a second in when the server's answer is cached, and up to about 8 s in when it is not and MetService is slow. Only those visitors are affected, which should not move the page's Core Web Vitals score (75th percentile). Remembering the last alert count to hold room before paint was considered and left out; revisit if Search Console shows a problem.

## Where the logic lives

| Unit | File | Job |
|---|---|---|
| `parseCapAlert(xml, now)` | `src/shared/helpers/warnings/parseCapAlert.ts` | One CAP document to its alerts (one per `info` block), or `[]` if dropped. Pure. |
| `fetchWarnings(now)` | `src/shared/helpers/warnings/fetchWarnings.ts` | The feed, then each alert, all sharing one 8 s limit. A failing alert is logged and skipped; the feed failing, not being an Atom feed, listing entries but no usable links, or every alert failing, throws and the route answers 502. The only network code. |
| `GET /api/warnings` | `src/app/api/warnings/route.ts` | The cached JSON, or the 502. |
| `alertsForPins` | `src/shared/helpers/warnings/alertsForPins.ts` | Matching, expiry, grouping, order. Pure. |
| `useWeatherAlerts` | `src/components/RainStrip/useWeatherAlerts.ts` | The client fetch. |
| `AlertLines` | `src/components/RainStrip/AlertLines.tsx` | The lines and credit. |

XML is read with `cheerio` in XML mode, which the app already depends on. Content Security Policy needs no change: the browser only calls our own `/api/warnings`.

## Tests

- **Parsing:** real alerts saved as fixtures (the yellow wind watch and the orange road snow alert), plus hand-edited copies for cancelled, test, non-public, expired, no colour, a foreign `web` link, two `info` blocks and no polygon.
- **Fetching:** the feed and its alerts, one alert failing, the feed failing (the network is mocked; the real MetService is never called).
- **Route:** 200 with its cache header, and 502.
- **Matching:** a pin inside, outside and just past an edge; two pins in one alert become one line; expired dropped; not-yet-started; the worst first.
- **Component:** lines, link, credit, "and N more", the neutral edge, switched off in Settings.
- **End to end:** the e2e stub also answers for `alerts.metservice.com` (the fetch shim in `e2e/stub/redirect-metvuw.mjs` gains that host). One stub alert has a polygon around Christchurch (and nowhere the other specs put a pin). Christchurch's band shows it above the heavy rain line, linked to MetService; Auckland's shows none; it is off when weather warnings are off in Settings; and the browser asks only `/api/warnings`. "With the feed down the band is as before" is covered by the hook, fetcher and route unit tests.

## Not in this work

Refreshing alerts while a page stays open; alerts on radar, satellite and upper air pages; the full alert text; notifications; and holding room against the layout shift.
