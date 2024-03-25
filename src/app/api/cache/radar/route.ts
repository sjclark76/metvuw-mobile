import axios from 'axios'
import cheerio from 'cheerio'
import { NextResponse } from 'next/server'

import { config } from '@/config'
import { s3upload } from '@/shared/helpers/s3Helper'
import { decodeRadarUrl } from '@/shared/helpers/urlHelper'
import { CacheRequestResult } from '@/shared/types/cacheRequestResult'
import { SatelliteChartData } from '@/shared/types/satelliteChartData'

async function retrieveRadarImages(): Promise<SatelliteChartData[]> {
  const response = await axios.get(
    new URL('radar/radar.php?location=nz', config.metvuwBaseUrl).href,
  )
  let rawHtml = response.data

  const $ = cheerio.load(rawHtml)

  const images: cheerio.Cheerio = $('img[src*=images]')

  return images.toArray().map((element: any) => {
    const relativeUrl = element.attribs.src
    let radarChartData = decodeRadarUrl(relativeUrl)

    const url = new URL(
      `radar/images/${relativeUrl.substring(9)}`,
      config.cloudFrontUrl,
    )

    return {
      ...radarChartData,
      url: url.href,
      width: +element.attribs.width,
      height: +element.attribs.height,
    }
  })
}

export async function GET(): Promise<NextResponse<CacheRequestResult>> {
  const result = await retrieveRadarImages()

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
