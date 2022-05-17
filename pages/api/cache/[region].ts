import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { RainChartData } from '../types/rainChartData'
import { config } from '../../../config'
import { decodeRainUrl } from '../helpers/urlHelper'
import { buildKeyName, s3upload } from '../helpers/s3Helper'
import { findRegionByCode, Region } from '../../../shared/region'

export async function getImageUrls(region: Region): Promise<RainChartData[]> {
  const url = new URL(
    `forecast/forecast.php?type=rain&region=${region.code}&noofdays=10`,
    config.metvuwBaseUrl
  )
  const response = await axios.get(url.href)

  let rawHtml = response.data

  const $ = cheerio.load(rawHtml)

  const images: cheerio.Cheerio = $('img[src*=rain]')

  return images.toArray().map((element: any) => {
    const relativeUrl = element.attribs.src
    const decodedSrc = decodeRainUrl(relativeUrl)
    const url = new URL(
      `forecast/${relativeUrl.substring(2)}`,
      config.cloudFrontUrl
    )
    return {
      ...decodedSrc,
      url: url.href,
      width: +element.attribs.width,
      height: +element.attribs.height,
    }
  })
}

const regionCacheApi = async (
  req: NextApiRequest,
  response: NextApiResponse
) => {
  let regionParam = req.query['region']

  if (!regionParam) regionParam = 'nz'

  const regionCode = Array.isArray(regionParam) ? regionParam[0] : regionParam

  const region = findRegionByCode(regionCode)

  if (region) {
    const rainCharts: RainChartData[] = await getImageUrls(region)

    const keyName = buildKeyName(region.code)

    await s3upload({
      Bucket: config.bucketName,
      Key: keyName,
      Body: JSON.stringify(rainCharts, null, 2),
    })

    response.status(200).json({
      success: true,
      fileName: keyName,
    })
  } else {
    response.status(400)
  }
}

export default regionCacheApi
