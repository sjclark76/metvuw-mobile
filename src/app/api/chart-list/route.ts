import { NextRequest, NextResponse } from 'next/server'

import { UPSTREAM_ERROR_CACHE_CONTROL } from '@/shared/helpers/dataSource/imageCache'
import { chartListForPath } from '@/shared/helpers/offline/chartList'

/**
 * The list changes with each model run, so shared caches keep it only briefly:
 * a page saved for offline use should fetch the newest charts when it refreshes.
 */
const CHART_LIST_CACHE_CONTROL = 'public, max-age=0, s-maxage=300'

/**
 * The charts on a page, for keeping it offline. The page itself is the unit that
 * is saved, so this answers the same question the page does (which charts?) in a
 * form the saving code can read.
 */
// An upper air page's list waits for the balloon data, which can take Wyoming
// 8 to 12 s; Vercel stops a function at 10 s by default.
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path')
  if (!path) {
    return NextResponse.json(
      { ok: false, message: 'missing path query param' },
      { status: 400 },
    )
  }

  try {
    const list = await chartListForPath(path)
    if (!list) {
      return NextResponse.json(
        { ok: false, message: 'not a chart page' },
        { status: 404 },
      )
    }
    if (list.urls.length === 0 && list.issued === undefined) {
      // Nothing was published. Saying so, rather than returning an empty list,
      // stops a refresh replacing saved charts with none. (A page that draws its
      // chart in the page has no images but is dated: that is a list.)
      return NextResponse.json(
        { ok: false, message: 'no charts available' },
        {
          status: 503,
          headers: { 'Cache-Control': UPSTREAM_ERROR_CACHE_CONTROL },
        },
      )
    }
    return NextResponse.json(list, {
      headers: { 'Cache-Control': CHART_LIST_CACHE_CONTROL },
    })
  } catch {
    return NextResponse.json(
      { ok: false, message: 'unable to list charts' },
      {
        status: 502,
        headers: { 'Cache-Control': UPSTREAM_ERROR_CACHE_CONTROL },
      },
    )
  }
}
