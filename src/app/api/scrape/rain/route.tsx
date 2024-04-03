import axios from 'axios'
import { NextResponse } from 'next/server'

import { config } from '@/config'
import { regions } from '@/shared/types/region'

export const dynamic = 'force-dynamic'

export async function GET() {
  // _request: NextRequest,
  // { params }: { params: { region: string } },
  // const force = Boolean(_request.nextUrl.searchParams.get('force'))

  const scrapeUrls = regions.map(
    (region) => new URL(`api/scrape/rain/${region.code}`, config.baseUrl),
  )

  try {
    await Promise.all(scrapeUrls.map((url) => axios.get(url.href)))

    return NextResponse.json({ ok: true })
  } catch (reason) {
    return NextResponse.error()
  }
}
