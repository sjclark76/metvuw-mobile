import { NextResponse } from 'next/server'

import { config } from '@/config'
import { s3upload } from '@/shared/helpers/s3Helper'
import { scrapeRadarImages } from '@/shared/helpers/screenScraper'
import { CacheRequestResult } from '@/shared/types/cacheRequestResult'

export async function GET(): Promise<NextResponse<CacheRequestResult>> {
  const result = await scrapeRadarImages()

  const keyName = 'radar.json'
  await s3upload({
    Bucket: config.s3.bucketName,
    Key: keyName,
    Body: JSON.stringify(result, null, 2),
  })

  const response: CacheRequestResult = {
    success: true,
    bucket: config.s3.bucketName,
    fileName: keyName,
  }

  return NextResponse.json(response)
}
