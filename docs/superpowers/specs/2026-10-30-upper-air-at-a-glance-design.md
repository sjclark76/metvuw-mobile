# Upper air: at a glance, and our own chart when metvuw's is stale

Approved in brainstorming on 2026-10-30. Mockups: options 1 and 3 in the session's `/tmp/ua-mockups/` (not kept in the repo).

## Why

The upper air pages show metvuw's tephigrams, which most visitors can't read. The only help is "What are these charts?" (`UpperAirExplainer`). Metvuw also stopped publishing them on 12 October 2026, so the pages show charts weeks old.

The University of Wyoming publishes each balloon sounding as text: height, temperature, dew point and wind at 1,000–4,500 levels, plus worked-out indices. From that we can say in plain words what the balloon found, and draw a simple, current chart.

## What a visitor sees

On each station's page (Whenuapai 93112, Paraparaumu 93417, Invercargill 93844):

1. **An "At a glance" panel at the top**, from the newest launch with data. Each line appears only when the data supports it (see the rules below):
   - freezing level, and the snow level about 300 m below it;
   - cloud layers, or "Dry: no cloud layers";
   - an inversion near the ground: "fog, haze or smog can be trapped";
   - wind at 1, 3 and 5 km;
   - temperature at 3 km;
   - stability: "Unstable: thunderstorms possible" or "Stable: thunderstorms unlikely".

   A source line ends the panel: "From Thursday 1:00am's balloon · University of Wyoming data. What the balloon measured, not a forecast." The source is linked to Wyoming's sounding page.
2. **The chart below it:**
   - metvuw's series, as today, while metvuw's newest tephigram is at least as recent as the launch used;
   - otherwise our chart in its place, with a note: "metvuw's charts stop at 12 Oct; this chart is drawn from Thursday's balloon."

   Our chart shows height (0–10 km) against temperature (−80 to 35 °C; lines are clipped at the plot's edge): the temperature and dew point lines, shaded cloud layers, a dashed freezing level, and wind arrows with speeds in knots at each kilometre. The arrows point where the wind blows to, and a line under the chart says so; the panel names where it blows from ("westerly"), as forecasts do. It credits Wyoming.
3. **Gaps are stated, never guessed.** When readings start above 500 m: "No readings below 2,200 m from this balloon" (with the actual height). When the newest launch has no data, the panel and chart use the latest launch that has, and say which.
4. **When Wyoming is unavailable** (no data in the last 4 launches, an error or a timeout), there's no panel and no chart of ours. The page is as it is today.

Only the latest launch with data is used: no history, time axis or animation for our chart.

## Data

- **Source:** `https://weather.uwyo.edu/wsgi/sounding?datetime=<YYYY-MM-DD HH:00:00>&id=<station>&src=UNKNOWN&type=TEXT:LIST`. Launches are at 00 and 12 UTC. The levels are a fixed-width table in the page (`PRES HGHT TEMP DWPT RELH MIXR DRCT SPED THTA THTE THTV`), with indices (`Lifted Index`, `Most Unstable CAPE`) below it. The CSV export returned one row in testing, so it isn't used.
- **Finding the launch:** start at the most recent 00 or 12 UTC at or before now, and step back one launch at a time, up to 4 launches (2 days). One 10 s time limit covers the whole search. The newest launch is cached for an hour and earlier launches for a day, since a launch's data doesn't change once published (`next: { revalidate }`; Next stores only 200 responses). Every stop other than a 400 is logged with `console.warn`, as is a run of 200s with no table (a likely format change). Wyoming's answers decide the next step:

  | Answer | Meaning | Next |
  |---|---|---|
  | 200 with table rows | data | use it |
  | 200 with no rows, or 400 ("Unable to retrieve the data for …") | no data for that launch | step back one launch |
  | 503 ("The server is too busy, try again later."), any other status, or a timeout | can't ask now | stop: no panel or chart of ours this render |

- **Reliability seen (22–29 Oct 2026, 48 launches):** all 48 have data. 39 start from the ground, 9 miss the lowest 1.2–2.4 km (clustered: Whenuapai started high for 3 days). Wyoming rate-limits: about 1 request in 5 got "too busy" even 6 s apart, so we never retry or step back on a 503.
- **Terms:** check Wyoming's terms of use before release.

## Rules

Heights are metres above sea level, as Wyoming gives them. A sounding is **low-complete** when its lowest reading is at or below 500 m.

| Line | Rule | Left out when |
|---|---|---|
| Freezing level | First height, going up, where temperature drops to 0 °C or below (interpolated between levels, rounded to 10 m). "At ground level" when the lowest reading is ≤ 0 °C and the sounding is low-complete. | The sounding isn't low-complete and its lowest reading is already ≤ 0 °C. |
| Snow level | Freezing level − 300 m, rounded to 100 m. If that's below the lowest reading: the lowest reading (rounded to 100 m) for a low-complete sounding. Worded "about". | No freezing level, or below the lowest reading of a sounding that isn't low-complete. |
| Cloud | Layers where temperature − dew point ≤ 3 °C, ≥ 150 m thick, below 9 km. Layers less than 100 m apart are merged; at most 3 are listed, lowest first. None: "Dry: no cloud layers", or with a gap note "Dry above N m: no cloud layers" (N as in the gap note). | Never left out. |
| Inversion | Below 1.5 km, temperature rises by ≥ 1 °C over ≥ 100 m of height. | The sounding isn't low-complete. |
| Wind | At 1, 3 and 5 km: the reading nearest each height, if within 150 m. 8 compass points (where it blows from) and knots. | No reading within 150 m. |
| Temperature at 3 km | The reading nearest 3,000 m, if within 150 m. | No reading within 150 m. |
| Stability | Lifted index ≤ −2 or CAPE ≥ 500 J/kg: "Unstable: thunderstorms possible". Otherwise "Stable: thunderstorms unlikely". | Either index is missing. |
| Gap note | "No readings below N m from this balloon", N rounded to 100 m. | The sounding is low-complete. |

**Ours or metvuw's:** ours replaces metvuw's when metvuw's newest chart is more than 2 hours older than the launch used (metvuw names charts at the actual launch, 11 and 23 UTC; Wyoming at the nominal 00 and 12 UTC), or metvuw has no charts.

## Where the logic lives

All on the server. The page renders the panel as text and our chart as inline SVG, with no new client JavaScript. Upper air pages already render on the server and are cached for an hour, and the post-deploy warm-up (`/api/warm`) renders them, so visitors never wait for Wyoming. Pages saved for offline use keep the panel and chart as they were when saved. When our chart is shown, the page's offline chart list gives the balloon's launch as its issue time, so each new balloon refreshes a saved page.

| Unit | File | Job |
|---|---|---|
| `fetchSounding(station, now)` | `src/shared/helpers/sounding/fetchSounding.ts` | Finds the newest launch with data (up to 4 tries). Returns the launch time and the parsed sounding, or `undefined`. The only network code. |
| `parseSounding(text)` | `src/shared/helpers/sounding/parseSounding.ts` | Page text → levels (pressure, height, temperature, dew point, wind direction and speed) and indices. Pure. |
| `summariseSounding(sounding)` | `src/shared/helpers/sounding/summariseSounding.ts` | The rules above → the lines to show and any gap note. Pure. |
| `SoundingGlance` | `src/components/UpperAirPage/SoundingGlance.tsx` | The "At a glance" panel. Server component. |
| `SoundingChart` | `src/components/UpperAirPage/SoundingChart.tsx` | Our chart, as SVG. Server component. |

`src/app/upperair/[[...balloon]]/page.tsx` fetches the sounding alongside metvuw's charts and passes both to `UpperAirPage`, which shows the panel and chooses the chart (`showOwnChart`, in `src/shared/helpers/sounding/showOwnChart.ts`). With our chart there is no footer (time axis and viewer): it steps through metvuw's series, which isn't shown. "No forecast" appears only when there are neither metvuw charts nor a sounding.

## Tests

- **Parsing and rules:** unit tests on saved real pages:
  - Invercargill 29 Oct 12 UTC, complete: freezing level about 970 m, cloud 620–1,430 m, W 33 kt at 1 km, stable;
  - Whenuapai 28 Oct 00 UTC, starting at 1,468 m: gap note, no inversion line;
  - Paraparaumu 28 Oct 00 UTC, no data.
- **Fetching:** stepping back across launches, the 10 s timeout, giving up after 4, and the URL for each station and time (network mocked).
- **Components:** each line shown or left out, the gap note, the source line and link, and our chart's freezing line, cloud bands and wind arrows.
- **End to end:** the e2e stub (`e2e/stub`) also answers for `weather.uwyo.edu`, so tests never call Wyoming. Its metvuw charts are from 11–14 Oct 2026, older than any launch, so:
  - Invercargill (93844) gets the complete sounding: the panel and our chart, no footer;
  - Paraparaumu (93417) gets the incomplete one: the panel with the gap note, and our chart;
  - Whenuapai (93112, the default page many tests use) gets "no data" for every launch: the page is as today.

## Not in this work

History or trends across launches; the reading guide (option 4); marks on metvuw's chart (option 2); stations other than the three.
