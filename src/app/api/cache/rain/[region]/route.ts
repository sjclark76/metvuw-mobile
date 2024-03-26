import { NextRequest, NextResponse } from 'next/server'

import { config } from '@/config'
import { buildKeyName, s3upload } from '@/shared/helpers/s3Helper'
import { scrapeRainImages } from '@/shared/helpers/screenScraper'
import { CacheRequestResult } from '@/shared/types/cacheRequestResult'
import { RainChartData } from '@/shared/types/rainChartData'
import { findRegionByCode } from '@/shared/types/region'

export async function GET(
  _request: NextRequest,
  { params }: { params: { region: string } },
): Promise<NextResponse<CacheRequestResult>> {
  const regionCode = params.region ?? 'nz'

  const region = findRegionByCode(regionCode)

  if (!region)
    return new NextResponse(`invalid region code: ${regionCode}`, {
      status: 404,
    })

  const rainCharts: RainChartData[] = await scrapeRainImages(region)

  const keyName = buildKeyName(region.code)

  await s3upload({
    Bucket: config.s3.bucketName,
    Key: keyName,
    Body: JSON.stringify(rainCharts, null, 2),
  })

  const response: CacheRequestResult = {
    success: true,
    bucket: config.s3.bucketName,
    fileName: keyName,
  }

  return NextResponse.json(response)
}
