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
// The whole search, not each request, so a slow Wyoming costs a page at most this.
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
 * next render of the page asks again. The whole search shares one 10 s timeout.
 */
export async function fetchSounding(
  station: BalloonLocationCode,
  now: Date = new Date(),
): Promise<FetchedSounding | undefined> {
  let launchUTC = latestLaunchUTC(now)
  let withoutTable = 0
  const signal = AbortSignal.timeout(TIMEOUT_MS)
  try {
    for (let tried = 0; tried < MOST_LAUNCHES; tried++) {
      const sourceUrl = soundingUrl(station, launchUTC)
      const response = await fetch(sourceUrl, {
        signal,
        // The newest launch may not be published yet, so look again within the
        // hour. An earlier one never changes once it has data, so keep it a day:
        // Wyoming rate-limits, and a 503 hides the panel until the page refreshes.
        next: { revalidate: tried === 0 ? 3600 : 86_400 },
      })
      if (response.ok) {
        const sounding = parseSounding(await response.text())
        if (sounding.levels.length > 0) {
          return { launchUTC, sounding, sourceUrl }
        }
        withoutTable++
      } else if (response.status !== 400) {
        const datetime = new Date(launchUTC)
          .toISOString()
          .replace('T', ' ')
          .slice(0, 16)

        // eslint-disable-next-line no-console
        console.warn(
          `[sounding] ${station} ${datetime}: Wyoming answered ${response.status}`,
        )
        await response.body?.cancel()
        return undefined
      }
      launchUTC -= HALF_DAY_MS
    }
  } catch (error) {
    // A network error or the timeout, while asking or while reading the page.
    // eslint-disable-next-line no-console
    console.warn(
      `[sounding] ${station}: ${error instanceof Error ? error.name : 'error'} asking Wyoming`,
    )
    return undefined
  }
  if (withoutTable > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `[sounding] ${station}: Wyoming's page had no table for ${withoutTable} launch(es); has its format changed?`,
    )
  }
  return undefined
}
