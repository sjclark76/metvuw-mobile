import { s3upload } from '@shared/helpers/s3Helper'
import { decodeRadarUrl } from '@shared/helpers/urlHelper'
import { CacheImageResult } from '@shared/types/cacheImageResult'
import { SatelliteChartData } from '@shared/types/satelliteChartData'
import axios from 'axios'
import cheerio from 'cheerio'
import { NextApiRequest, NextApiResponse } from 'next'

import { config } from '@/config'

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

const radarCacheApi = async (
  req: NextApiRequest,
  res: NextApiResponse<CacheImageResult>,
) => {
  const result = await retrieveRadarImages()

  await s3upload({
    Bucket: config.s3.bucketName,
    Key: 'radar.json',
    Body: JSON.stringify(result, null, 2),
  })
  res.status(200).json({
    success: true,
    bucket: config.s3.bucketName,
    fileName: 'radar.json',
  })
}

export default radarCacheApi
