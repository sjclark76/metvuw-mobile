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
  /** Other addresses that show this same page, kept so it opens at each. */
  aliases?: string[]
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

/** The Places page: the places someone watches, and the way to add one. */
export const PINS_PATH = '/pins'

/** The Settings page: how the app is set up on this device. */
export const SETTINGS_PATH = '/settings'

/**
 * Pages kept whenever a page is saved, so they open with no connection: the list
 * of what is saved, and the pins. Neither is any one saved page's, so they stay
 * until nothing is saved (see `collectGarbage`, which never removes them).
 */
export const KEPT_WITH_SAVED_PAGES = [SAVED_LIST_PATH, PINS_PATH, SETTINGS_PATH]

const listUrl = (path: string) =>
  `/api/chart-list?path=${encodeURIComponent(path)}`

/** Only the charts our own proxy serves: the list is data, not instructions. */
function isChartUrl(url: unknown): url is string {
  return typeof url === 'string' && url.startsWith(PROXY_PREFIX)
}

/** A path on this site: not another address, however it is written. */
const isAddress = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.startsWith('/\\')

function isChartList(value: unknown): value is ChartList {
  if (typeof value !== 'object' || value === null) return false
  const list = value as Record<string, unknown>
  return (
    isAddress(list.path) &&
    (list.aliases === undefined ||
      (Array.isArray(list.aliases) && list.aliases.every(isAddress))) &&
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
  // A page that redirects cannot be kept: browsers refuse to open a redirected
  // response for a navigation, so what was saved would never be shown.
  if (!response.ok || response.redirected) {
    throw new Error(`could not download ${path}`)
  }
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
  // The page's other addresses, and the way back to what was saved. Not worth
  // failing a save over: an address that cannot be kept is just not recorded.
  const aliases: string[] = []
  for (const alias of list.aliases ?? []) {
    try {
      await keepPage(alias, deps)
      aliases.push(alias)
    } catch {
      // Opens online as usual; offline it is not available at this address.
    }
  }
  for (const path of KEPT_WITH_SAVED_PAGES) {
    await keepPage(path, deps).catch(() => {})
  }

  return {
    path: list.path,
    aliases,
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

type Verdict = 'itself' | 'elsewhere' | 'unknown'

/**
 * Whether an address shows the page it is meant to, or sends the visitor on to
 * another (the home page does, once they have chosen their own). Asked not to
 * follow the redirect, and the body is dropped unread: this is only a question.
 */
async function servesItself(
  address: string,
  deps: Dependencies,
): Promise<Verdict> {
  try {
    const response = await deps.fetch(address, {
      redirect: 'manual',
      // Not from the browser's own cache: it still held the page from an earlier
      // visit and answered with that, so a changed home page was never noticed.
      cache: 'no-store',
    })
    void response.body?.cancel()
    if (response.type === 'opaqueredirect') return 'elsewhere'
    return response.ok ? 'itself' : 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * A page's other addresses are only true while they show the same page, and a
 * visitor can change that after saving (by choosing another home page). So they
 * are checked again on every refresh: one that now sends the visitor elsewhere is
 * dropped, one that now shows the page is added and kept. When it cannot be
 * checked (no connection part way, say) the addresses stay as they were.
 */
async function reconcileAliases(
  saved: SavedPage,
  list: ChartList,
  deps: Dependencies,
): Promise<string[]> {
  const recorded = saved.aliases ?? []
  const addresses = [...new Set([...recorded, ...(list.aliases ?? [])])]
  const aliases: string[] = []

  for (const address of addresses) {
    const verdict = await servesItself(address, deps)
    if (verdict === 'elsewhere') continue
    if (recorded.includes(address)) {
      aliases.push(address)
    } else if (verdict === 'itself') {
      try {
        await keepPage(address, deps)
        aliases.push(address)
      } catch {
        // Not kept, so not recorded.
      }
    }
  }
  return aliases
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
    return {
      ...saved,
      title: list.title,
      aliases: await reconcileAliases(saved, list, deps),
      refreshedAt: deps.now(),
    }
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
    ...KEPT_WITH_SAVED_PAGES,
    ...saved.flatMap((page) => [page.path, ...(page.aliases ?? [])]),
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

/** Whether this saved page is the page at `path`, at any of its addresses. */
export function coversPath(page: SavedPage, path: string): boolean {
  return page.path === path || (page.aliases ?? []).includes(path)
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
  return stored
    .filter((page): page is SavedPage => {
      if (!isSavedPage(page) || seen.has(page.path)) return false
      seen.add(page.path)
      return true
    })
    .map((page) => ({
      ...page,
      aliases: Array.isArray(page.aliases)
        ? page.aliases.filter(isAddress)
        : [],
    }))
}
