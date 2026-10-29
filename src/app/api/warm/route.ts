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
const PAGE_TIMEOUT_MS = 15_000

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
  if (page.ok) warmed++
  else failed.push(`${path} ${page.status}`)

  // The first chart is what a visitor waits for (the Largest Contentful Paint).
  try {
    const firstChart = (await chartListForPath(path))?.urls[0]
    if (firstChart) {
      const chart = await fetch(`${origin}${firstChart}`, { cache: 'no-store' })
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
  const paths = sitemap().map(({ url }) => new URL(url).pathname)
  const from = Math.max(
    0,
    Number.parseInt(request.nextUrl.searchParams.get('from') ?? '0', 10) || 0,
  )
  const started = Date.now()

  let warmed = 0
  const failed: string[] = []
  let i = from
  while (i < paths.length && Date.now() - started < BUDGET_MS) {
    const results = await Promise.all(
      paths
        .slice(i, i + CONCURRENCY)
        .map((path) => warmPageInTime(origin, path)),
    )
    for (const result of results) {
      warmed += result.warmed
      failed.push(...result.failed)
    }
    i += CONCURRENCY
  }

  return NextResponse.json({
    ok: failed.length === 0,
    warmed,
    failed,
    next: i < paths.length ? i : null,
  })
}
