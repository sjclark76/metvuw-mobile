import axios from 'axios'
import cheerio from 'cheerio'
import { NextResponse } from 'next/server'

import { config } from '@/config'
import { s3upload } from '@/shared/helpers/s3Helper'
import { decodeUpperAirUrl } from '@/shared/helpers/urlHelper'
import { CacheRequestResult } from '@/shared/types/cacheRequestResult'
import { SatelliteChartData } from '@/shared/types/satelliteChartData'

async function retrieveRadarImages(): Promise<SatelliteChartData[]> {
  const response = await axios.get(
    new URL('upperair', config.metvuwBaseUrl).href,
  )
  let rawHtml = response.data

  const $ = cheerio.load(rawHtml)

  const images: cheerio.Cheerio = $('img[src$="thumb.png"]')

  return images.toArray().map((element: any) => {
    const relativeUrl = element.attribs.src
    let upperAirChartData = decodeUpperAirUrl(relativeUrl)

    const url = new URL(
      `upperair/${relativeUrl.replace('.thumb', '')}`,
      config.cloudFrontUrl,
    )

    return {
      ...upperAirChartData,
      url: url.href,
      width: +element.attribs.width,
      height: +element.attribs.height,
    }
  })
}
export async function GET(): Promise<NextResponse<CacheRequestResult>> {
  const result = await retrieveRadarImages()

  const keyName = 'upperair.json'

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
