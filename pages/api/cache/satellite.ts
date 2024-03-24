import axios from 'axios'
import cheerio from 'cheerio'
import { NextApiRequest, NextApiResponse } from 'next'

import { config } from '@/config'
import { s3upload } from '@/shared/helpers/s3Helper'
import { decodeSatelliteUrl } from '@/shared/helpers/urlHelper'
import { CacheImageResult } from '@/shared/types/cacheImageResult'
import { SatelliteChartData } from '@/shared/types/satelliteChartData'

async function retrieveSatelliteImages(): Promise<SatelliteChartData[]> {
  const response = await axios.get(
    new URL('satellite', config.metvuwBaseUrl).href,
  )
  let rawHtml = response.data

  const $ = cheerio.load(rawHtml)

  const images: cheerio.Cheerio = $('img[src*=small]')

  return images.toArray().map((element: any) => {
    const relativeUrl = element.attribs.src
    let satelliteChartData = decodeSatelliteUrl(relativeUrl)

    const url = new URL(
      `satellite/big/${relativeUrl.substring(8)}`,
      config.cloudFrontUrl,
    )

    return {
      ...satelliteChartData,
      url: url.href,
      width: +element.attribs.width,
      height: +element.attribs.height,
    }
  })
}

const satelliteCacheApi = async (
  req: NextApiRequest,
  res: NextApiResponse<CacheImageResult>,
) => {
  const result = await retrieveSatelliteImages()

  await s3upload({
    Bucket: config.s3.bucketName,
    Key: 'satellite.json',
    Body: JSON.stringify(result, null, 2),
  })

  res.status(200).json({
    success: true,
    bucket: config.s3.bucketName,
    fileName: 'satellite.json',
  })
}

export default satelliteCacheApi
