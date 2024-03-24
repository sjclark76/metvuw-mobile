import { s3upload } from '@shared/helpers/s3Helper'
import { decodeUpperAirUrl } from '@shared/helpers/urlHelper'
import { CacheImageResult } from '@shared/types/cacheImageResult'
import { SatelliteChartData } from '@shared/types/satelliteChartData'
import axios from 'axios'
import cheerio from 'cheerio'
import { NextApiRequest, NextApiResponse } from 'next'

import { config } from '@/config'

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

const radarCacheApi = async (
  req: NextApiRequest,
  res: NextApiResponse<CacheImageResult>,
) => {
  const result = await retrieveRadarImages()

  await s3upload({
    Bucket: config.s3.bucketName,
    Key: 'upperair.json',
    Body: JSON.stringify(result, null, 2),
  })
  res.status(200).json({
    success: true,
    bucket: config.s3.bucketName,
    fileName: 'upperair.json',
  })
}

export default radarCacheApi
