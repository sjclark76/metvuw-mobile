import { NextResponse } from 'next/server'

import { config } from '@/config'
import { s3upload } from '@/shared/helpers/s3Helper'
import { scrapeSatelliteImages } from '@/shared/helpers/screenScraper'
import { CacheRequestResult } from '@/shared/types/cacheRequestResult'

export async function GET(): Promise<NextResponse<CacheRequestResult>> {
  const result = await scrapeSatelliteImages()

  const keyName = 'satellite.json'

  await s3upload({
    Body: JSON.stringify(result, null, 2),
    Bucket: config.s3.bucketName,
    Key: keyName,
  })

  const response: CacheRequestResult = {
    bucket: config.s3.bucketName,
    fileName: keyName,
    success: true,
  }

  return NextResponse.json(response)
}
