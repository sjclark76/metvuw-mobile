import { timingSafeEqual } from 'node:crypto'

import { NextRequest, NextResponse } from 'next/server'

import sitemap from '@/app/sitemap'
import { chartListForPath } from '@/shared/helpers/offline/chartList'

// Rendering a page nobody has visited since the last deploy takes 3 to 4 s
// (metvuw.com is scraped first), so a deploy leaves every page slow for its
// next visitor. This is called after each production deploy to render them,
// and fetch each page's first chart, before anyone has to wait.
//
// The Hobby plan stops a function at 60 s, and warming every page takes longer,
// so it stops starting pages after BUDGET_MS and says where to carry on from:
// the caller asks again with `?from=` that `next` until `next` is null.
export const maxDuration = 60

/** Pages at once: enough to finish quickly, few enough to be kind to metvuw.com. */
const CONCURRENCY = 4
/** No new pages after this, leaving room for the last ones to finish. */
const BUDGET_MS = 30_000
/** A page (with its chart) that takes longer than this is reported, not waited for. */
const PAGE_TIMEOUT_MS = 25_000
/**
 * Between upper air pages. Each asks the University of Wyoming for its balloon,
 * and Wyoming answers a burst of requests with "too busy", which leaves the page
 * without its panel for the hour it is cached.
 */
const UPPER_AIR_GAP_MS = 3_000

const isUpperAir = (path: string) =>
  path === '/upperair' || path.startsWith('/upperair/')

/**
 * The other pages first; then the upper air stations, one at a time; then
 * /upperair, which shows the default station, whose balloon is cached by then.
 */
function warmingOrder(paths: string[]): string[] {
  return [
    ...paths.filter((path) => !isUpperAir(path)),
    ...paths.filter((path) => isUpperAir(path) && path !== '/upperair'),
    ...paths.filter((path) => path === '/upperair'),
  ]
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function isAuthorised(request: NextRequest): boolean {
  const secret = process.env.WARM_SECRET
  const token = request.headers.get('x-warm-token')
  if (!secret || !token) return false
  const expected = Buffer.from(secret)
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

async function warmPage(
  origin: string,
  path: string,
): Promise<{ warmed: number; failed: string[] }> {
  let warmed = 0
  const failed: string[] = []

  const page = await fetch(`${origin}${path}`, { cache: 'no-store' })
  // Read to the end: an upper air page streams the balloon data in, and is only
  // rendered (and cached) whole if someone reads it all.
  await page.arrayBuffer()
  if (page.ok) warmed++
  else failed.push(`${path} ${page.status}`)

  // The first chart is what a visitor waits for (the Largest Contentful Paint).
  try {
    const firstChart = (await chartListForPath(path))?.urls[0]
    if (firstChart) {
      const chart = await fetch(`${origin}${firstChart}`, { cache: 'no-store' })
      // Read to the end too: the CDN keeps only an image it has sent whole.
      await chart.arrayBuffer()
      if (chart.ok) warmed++
      else failed.push(`${firstChart} ${chart.status}`)
    }
  } catch {
    failed.push(`${path} charts`)
  }

  return { warmed, failed }
}

function warmPageInTime(origin: string, path: string) {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timedOut = new Promise<{ warmed: number; failed: string[] }>(
    (resolve) => {
      timer = setTimeout(
        () => resolve({ warmed: 0, failed: [`${path} timed out`] }),
        PAGE_TIMEOUT_MS,
      )
    },
  )
  const warming = warmPage(origin, path).catch(() => ({
    warmed: 0,
    failed: [`${path} unreachable`],
  }))
  return Promise.race([warming, timedOut]).finally(() => clearTimeout(timer))
}

export async function POST(request: NextRequest) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  // The origin it was called on, not the canonical one: that may be the bare
  // domain, which redirects every request to www.
  const origin = request.nextUrl.origin
  const paths = warmingOrder(sitemap().map(({ url }) => new URL(url).pathname))
  const firstUpperAir = paths.findIndex(isUpperAir)
  const from = Math.max(
    0,
    Number.parseInt(request.nextUrl.searchParams.get('from') ?? '0', 10) || 0,
  )
  const started = Date.now()

  let warmed = 0
  const failed: string[] = []
  let i = from
  while (i < paths.length && Date.now() - started < BUDGET_MS) {
    // Upper air pages one at a time, apart; the rest a few at a time, up to them.
    let batch: string[]
    if (isUpperAir(paths[i])) {
      if (i > firstUpperAir) await pause(UPPER_AIR_GAP_MS)
      batch = [paths[i]]
    } else {
      const end = firstUpperAir === -1 ? paths.length : firstUpperAir
      batch = paths.slice(i, Math.min(i + CONCURRENCY, end))
    }
    const results = await Promise.all(
      batch.map((path) => warmPageInTime(origin, path)),
    )
    for (const result of results) {
      warmed += result.warmed
      failed.push(...result.failed)
    }
    i += batch.length
  }

  return NextResponse.json({
    ok: failed.length === 0,
    warmed,
    failed,
    next: i < paths.length ? i : null,
  })
}
