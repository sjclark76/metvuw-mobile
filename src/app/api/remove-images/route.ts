import { NextRequest, NextResponse } from 'next/server'

import { removeImage } from '@/shared/helpers/v2/jobs'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  const numberParam = _request.nextUrl.searchParams.get('number')

  const number = numberParam ? +numberParam : 1
  const removeCount = await removeImage(number)

  return NextResponse.json({
    ok: true,
    'number-requested': number,
    'number-removed': removeCount,
  })
}
