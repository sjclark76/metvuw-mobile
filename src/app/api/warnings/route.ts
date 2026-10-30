import { NextResponse } from 'next/server'

import { UPSTREAM_ERROR_CACHE_CONTROL } from '@/shared/helpers/dataSource/imageCache'
import { fetchWarnings } from '@/shared/helpers/warnings/fetchWarnings'

// MetService updates its feed every few minutes: shared caches keep it as long.
const WARNINGS_CACHE_CONTROL =
  'public, max-age=0, s-maxage=300, stale-while-revalidate=300'

/**
 * MetService's current alerts, with their areas, for the browser to match to the
 * visitor's pins. The areas come here rather than the pins going there: pins stay
 * on the device. The feed does not allow other sites' browsers to read it.
 */
export async function GET() {
  try {
    const alerts = await fetchWarnings()
    return NextResponse.json(
      { alerts },
      { headers: { 'Cache-Control': WARNINGS_CACHE_CONTROL } },
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      `[warnings] MetService alerts unavailable: ${error instanceof Error ? error.message : 'error'}`,
    )
    return NextResponse.json(
      { ok: false, message: 'unable to fetch warnings' },
      {
        status: 502,
        headers: { 'Cache-Control': UPSTREAM_ERROR_CACHE_CONTROL },
      },
    )
  }
}
