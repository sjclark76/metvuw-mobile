import * as cheerio from 'cheerio'

import { parseCapAlert, type WeatherAlert } from './parseCapAlert'

const FEED = 'https://alerts.metservice.com/cap/atom'
// Only alerts on MetService's own host are followed: the feed names them.
const ALERT_PREFIX = 'https://alerts.metservice.com/cap/alert?'
// The feed asks to be read every 5 minutes.
const FEED_REVALIDATE_SECONDS = 300
// An alert's document never changes (an update gets a new id).
const ALERT_REVALIDATE_SECONDS = 3600
// The route may run 10 s: the feed and all its alerts share 8.
const TIMEOUT_MS = 8_000

/**
 * MetService's current alerts: the Atom feed, then each alert it links. An alert
 * that cannot be had is logged and left out; if all of them fail, so does this.
 */
export async function fetchWarnings(
  now: Date = new Date(),
): Promise<WeatherAlert[]> {
  const signal = AbortSignal.timeout(TIMEOUT_MS)
  const feed = await fetch(FEED, {
    signal,
    next: { revalidate: FEED_REVALIDATE_SECONDS },
  })
  if (!feed.ok) throw new Error(`feed answered ${feed.status}`)

  const $ = cheerio.load(await feed.text(), { xml: true })
  if ($('feed').length === 0) throw new Error('the feed is not an Atom feed')
  const entries = $('entry').length
  const hrefs = $('entry > link[rel="related"]')
    .toArray()
    .map((link) => $(link).attr('href') ?? '')
  const links = hrefs.filter((href) => href.startsWith(ALERT_PREFIX))
  if (entries > 0 && links.length === 0) {
    throw new Error(`${entries} feed entries but no alert links`)
  }
  for (const href of hrefs) {
    if (!href.startsWith(ALERT_PREFIX)) {
      // eslint-disable-next-line no-console
      console.warn(`[warnings] feed link ignored: ${href}`)
    }
  }

  const outcomes = await Promise.all(
    links.map(async (link) => {
      try {
        const response = await fetch(link, {
          signal,
          next: { revalidate: ALERT_REVALIDATE_SECONDS },
        })
        if (!response.ok) return skipped(link, `answered ${response.status}`)
        const body = await response.text()
        if (
          cheerio.load(body, { xml: true })('alert > identifier').length === 0
        ) {
          return skipped(link, 'not a CAP alert')
        }
        return parseCapAlert(body, now)
      } catch (error) {
        return skipped(
          link,
          error instanceof Error ? `${error.name}: ${error.message}` : 'error',
        )
      }
    }),
  )
  if (links.length > 0 && outcomes.every((outcome) => outcome === null)) {
    throw new Error(`all ${links.length} alerts failed`)
  }
  return outcomes.flatMap((outcome) => outcome ?? [])
}

/** Logs an alert that could not be had, and marks it failed (null). */
function skipped(link: string, reason: string): null {
  // eslint-disable-next-line no-console
  console.warn(`[warnings] alert ${link} skipped: ${reason}`)
  return null
}
