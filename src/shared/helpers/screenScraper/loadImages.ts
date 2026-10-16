import * as cheerio from 'cheerio'

import { config } from '@/config'
import { ScrapeError } from '@/shared/helpers/screenScraper/scrapeError'

const TIMEOUT_MS = 10_000

/**
 * Fetches a metvuw page and returns the `src` of every image matching the
 * selector. Throws a ScrapeError if the page can't be fetched (network error,
 * timeout, non-2xx) or contains no matching images, which means the structure
 * changed or we were served an error page.
 */
export async function loadImages(
  url: string,
  imageSelector: string,
): Promise<{ relativeUrl: string }[]> {
  const target = new URL(url, config.metvuwBaseUrl).href

  let rawHtml: string
  try {
    // The signal covers reading the body as well as the request itself.
    const response = await fetch(target, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 3600 },
    })
    if (!response.ok) {
      throw new ScrapeError(`${target} responded ${response.status}`)
    }
    rawHtml = await response.text()
  } catch (error) {
    if (error instanceof ScrapeError) throw error
    throw new ScrapeError(
      `failed to load ${target}: ${error instanceof Error ? error.message : error}`,
      { cause: error },
    )
  }

  const $ = cheerio.load(rawHtml)
  const sources = $(imageSelector)
    .toArray()
    .map((element) => $(element).attr('src'))
    .filter((src): src is string => Boolean(src))

  if (sources.length === 0) {
    throw new ScrapeError(`no images matched "${imageSelector}" on ${target}`)
  }

  return sources.map((relativeUrl) => ({ relativeUrl }))
}
