import type { ChartList } from './chartList'

/**
 * Keeping chart pages for offline use. A saved page is its charts (in one cache)
 * and the page itself (in another), both read by the service worker when there is
 * no connection. What is saved, and when, is a small list the app keeps beside
 * them; everything here works from that list and the two caches.
 */

export const SAVED_CHARTS_CACHE = 'saved-charts'
export const SAVED_PAGES_CACHE = 'saved-pages'

/** A page is kept for a week from the last time it was confirmed current. */
export const SAVED_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000

/** What the app remembers about one saved page. */
export interface SavedPage {
  path: string
  title: string
  /** When its charts were issued (epoch ms). */
  issued: number | undefined
  /** Last time it was downloaded or confirmed to be the newest (epoch ms). */
  refreshedAt: number
  /** Every chart kept for it. */
  urls: string[]
  /** Size of those charts. */
  bytes: number
}

export interface Dependencies {
  fetch: typeof fetch
  caches: CacheStorage
  now: () => number
}

// Few at a time: all of a page's charts at once would crowd out the page the
// visitor is looking at, and a poor connection serves none of them well.
const CONCURRENCY = 4
// A page names far fewer than this; it only bounds a page that somehow names many.
const MAX_ASSETS = 80

const PROXY_PREFIX = '/api/fallback-image?'

/** The list of saved pages. It has to open offline too, so it is kept with them. */
export const SAVED_LIST_PATH = '/saved'

const listUrl = (path: string) =>
  `/api/chart-list?path=${encodeURIComponent(path)}`

/** Only the charts our own proxy serves: the list is data, not instructions. */
function isChartUrl(url: unknown): url is string {
  return typeof url === 'string' && url.startsWith(PROXY_PREFIX)
}

function isChartList(value: unknown): value is ChartList {
  if (typeof value !== 'object' || value === null) return false
  const list = value as Record<string, unknown>
  return (
    typeof list.path === 'string' &&
    list.path.startsWith('/') &&
    !list.path.startsWith('//') &&
    typeof list.title === 'string' &&
    (list.issued === undefined || typeof list.issued === 'number') &&
    Array.isArray(list.urls) &&
    list.urls.length > 0 &&
    list.urls.every(isChartUrl)
  )
}

async function fetchList(path: string, deps: Dependencies): Promise<ChartList> {
  const response = await deps.fetch(listUrl(path))
  if (!response.ok) throw new Error(`no chart list for ${path}`)
  const list: unknown = await response.json()
  if (!isChartList(list)) throw new Error(`unusable chart list for ${path}`)
  return list
}

/** Runs `work` over `items`, a few at a time. Rejects as soon as one does. */
async function inBatches<T>(
  items: readonly T[],
  work: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0
  const worker = async () => {
    while (next < items.length) await work(items[next++])
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker),
  )
}

/** The scripts and styles a page's HTML names, which it needs to run offline. */
function assetsIn(html: string): string[] {
  const found = html.match(/\/_next\/static\/[^"'\s\\<>)]+\.(?:js|css)/g) ?? []
  return [...new Set(found)].slice(0, MAX_ASSETS)
}

async function keepPage(path: string, deps: Dependencies): Promise<void> {
  const response = await deps.fetch(path)
  if (!response.ok) throw new Error(`could not download ${path}`)
  const copy = response.clone()
  const html = await response.text()
  await (await deps.caches.open(SAVED_PAGES_CACHE)).put(path, copy)

  // Going through the page's own fetch means the service worker keeps them too.
  // A script that will not download is no reason to lose the charts.
  await inBatches(assetsIn(html), async (asset) => {
    try {
      await deps.fetch(asset)
    } catch {
      // Best effort.
    }
  })
}

async function keepList(
  list: ChartList,
  deps: Dependencies,
): Promise<SavedPage> {
  const charts = await deps.caches.open(SAVED_CHARTS_CACHE)
  let bytes = 0

  await inBatches(list.urls, async (url) => {
    const held = await charts.match(url)
    if (held) {
      // Size first, then add: `bytes += await ...` would read `bytes` before the
      // await and so lose what other downloads added meanwhile.
      const size = (await held.blob()).size
      bytes += size
      return
    }
    const response = await deps.fetch(url)
    if (!response.ok) throw new Error(`could not download ${url}`)
    const copy = response.clone()
    await charts.put(url, copy)
    const size = (await response.blob()).size
    bytes += size
  })

  await keepPage(list.path, deps)
  // The way back to what was saved. Not worth failing a save over.
  await keepPage(SAVED_LIST_PATH, deps).catch(() => {})

  return {
    path: list.path,
    title: list.title,
    issued: list.issued,
    refreshedAt: deps.now(),
    urls: list.urls,
    bytes,
  }
}

/**
 * Saves a page: all of its charts, and the page. Throws, leaving nothing
 * recorded, if any chart or the page cannot be downloaded: half a forecast is
 * worse than none. (What it did manage to keep is swept up by `collectGarbage`.)
 */
export async function downloadPage(
  path: string,
  deps: Dependencies,
): Promise<SavedPage> {
  return keepList(await fetchList(path, deps), deps)
}

/**
 * Brings a saved page up to date. When it still has the newest charts, that is
 * all that is checked (one small request, no download) and the page is simply
 * marked current. When there is a new run, the new charts are downloaded, and
 * the saved page is only replaced once they all have been: if this throws, the
 * page the caller already has is still complete.
 */
export async function refreshPage(
  saved: SavedPage,
  deps: Dependencies,
): Promise<SavedPage> {
  const list = await fetchList(saved.path, deps)
  const unchanged =
    list.issued === saved.issued &&
    list.urls.length === saved.urls.length &&
    list.urls.every((url, i) => url === saved.urls[i])
  if (unchanged) {
    return { ...saved, title: list.title, refreshedAt: deps.now() }
  }
  return keepList(list, deps)
}

const keyOf = (request: Request) => {
  const url = new URL(request.url, 'http://localhost')
  return { path: url.pathname, withQuery: url.pathname + url.search }
}

/**
 * Deletes whatever no saved page needs: charts from a run that has been
 * replaced, from a refresh that stopped part way, or from a page that was
 * removed or expired; and the pages themselves. Charts two pages share stay.
 */
export async function collectGarbage(
  saved: readonly SavedPage[],
  deps: Dependencies,
): Promise<void> {
  const wantedCharts = new Set(saved.flatMap((page) => page.urls))
  const wantedPages = new Set([
    SAVED_LIST_PATH,
    ...saved.map((page) => page.path),
  ])

  const charts = await deps.caches.open(SAVED_CHARTS_CACHE)
  for (const request of await charts.keys()) {
    if (!wantedCharts.has(keyOf(request).withQuery))
      await charts.delete(request)
  }
  const pages = await deps.caches.open(SAVED_PAGES_CACHE)
  for (const request of await pages.keys()) {
    if (!wantedPages.has(keyOf(request).path)) await pages.delete(request)
  }
}

/** Pages that have gone a week without being confirmed current. */
export function expiredPages(
  saved: readonly SavedPage[],
  now: number,
): SavedPage[] {
  return saved.filter((page) => now - page.refreshedAt > SAVED_LIFETIME_MS)
}

const isSavedPage = (value: unknown): value is SavedPage => {
  if (typeof value !== 'object' || value === null) return false
  const page = value as Record<string, unknown>
  return (
    typeof page.path === 'string' &&
    page.path.startsWith('/') &&
    !page.path.startsWith('//') &&
    typeof page.title === 'string' &&
    (page.issued === undefined || typeof page.issued === 'number') &&
    typeof page.refreshedAt === 'number' &&
    Number.isFinite(page.refreshedAt) &&
    typeof page.bytes === 'number' &&
    Array.isArray(page.urls) &&
    page.urls.every(isChartUrl)
  )
}

/**
 * The saved pages in whatever was stored, dropping anything that is not one
 * (and a second entry for the same page), so the rest of the app can rely on
 * the shape.
 */
export function sanitizeSavedPages(stored: unknown): SavedPage[] {
  if (!Array.isArray(stored)) return []
  const seen = new Set<string>()
  return stored.filter((page): page is SavedPage => {
    if (!isSavedPage(page) || seen.has(page.path)) return false
    seen.add(page.path)
    return true
  })
}
