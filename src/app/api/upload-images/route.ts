import { NextRequest, NextResponse } from 'next/server'

import { uploadImages } from '@/shared/helpers/v2/jobs/uploadImagesJob'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  const numberParam = _request.nextUrl.searchParams.get('number')

  const number = numberParam ? +numberParam : 1
  const uploadCount = await uploadImages(number)

  return NextResponse.json({
    ok: true,
    'number-requested': number,
    'number-added': uploadCount,
  })
}
