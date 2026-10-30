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
