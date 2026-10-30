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
 * An upper air page streams in its balloon from the University of Wyoming,
 * which can take 50 s (see fetchSounding), and Wyoming answers a burst of
 * requests "too busy". So each is warmed alone, at the start of a call, with
 * the rest of the call's minute to finish; the caller asks again for the next.
 */
const UPPER_AIR_PAGE_TIMEOUT_MS = 52_000
/** An upper air page is only started this early in a call. */
const UPPER_AIR_START_BY_MS = 5_000

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

function warmPageInTime(origin: string, path: string, timeoutMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timedOut = new Promise<{ warmed: number; failed: string[] }>(
    (resolve) => {
      timer = setTimeout(
        () => resolve({ warmed: 0, failed: [`${path} timed out`] }),
        timeoutMs,
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
    if (isUpperAir(paths[i])) {
      // One a call, and only at its start: the next call does the next.
      if (Date.now() - started > UPPER_AIR_START_BY_MS) break
      const result = await warmPageInTime(
        origin,
        paths[i],
        UPPER_AIR_PAGE_TIMEOUT_MS,
      )
      warmed += result.warmed
      failed.push(...result.failed)
      i++
      break
    }
    // The other pages a few at a time, up to the upper air ones.
    const end = firstUpperAir === -1 ? paths.length : firstUpperAir
    const batch = paths.slice(i, Math.min(i + CONCURRENCY, end))
    const results = await Promise.all(
      batch.map((path) => warmPageInTime(origin, path, PAGE_TIMEOUT_MS)),
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
