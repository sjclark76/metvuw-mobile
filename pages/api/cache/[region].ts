import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { RainChartData } from '../types/rainChartData'
import { config } from '../../../config'
import { decodeRainUrl } from '@shared/helpers/urlHelper'
import { buildKeyName, s3upload } from '@shared/helpers/s3Helper'
import { findRegionByCode, Region } from '../../../shared/region'
import { CacheImageResult } from '../types/cacheImageResult'

type RainChartDataCache = RainChartData & {
  primed: boolean
}
async function primeCache(url: URL) {
  try {
    const { status } = await axios.get(url.href)

    return status === 200
  } catch (e) {
    return false
  }
}

export async function getImageUrls(
  region: Region,
): Promise<RainChartDataCache[]> {
  const url = new URL(
    `forecast/forecast.php?type=rain&region=${region.code}&noofdays=10`,
    config.metvuwBaseUrl,
  )
  const response = await axios.get(url.href)

  let rawHtml = response.data

  const $ = cheerio.load(rawHtml)

  const images: cheerio.Cheerio = $('img[src*=rain]')

  const results = images.toArray().map((element: any) => {
    const relativeUrl = element.attribs.src
    const decodedSrc = decodeRainUrl(relativeUrl)
    const url = new URL(
      `forecast/${relativeUrl.substring(2)}`,
      config.cloudFrontUrl,
    )
    return {
      ...decodedSrc,
      url: url.href,
      width: +element.attribs.width,
      height: +element.attribs.height,
    }
  })

  const primedResults = results.map((result) => {
    return primeCache(url).then((value) => ({ ...result, primed: value }))
  })
  return Promise.all(primedResults)
}

const regionCacheApi = async (
  req: NextApiRequest,
  response: NextApiResponse<CacheImageResult>,
) => {
  let regionParam = req.query['region']

  if (!regionParam) regionParam = 'nz'

  const regionCode = Array.isArray(regionParam) ? regionParam[0] : regionParam

  const region = findRegionByCode(regionCode)

  if (region) {
    const rainCharts: RainChartData[] = await getImageUrls(region)

    const keyName = buildKeyName(region.code)

    await s3upload({
      Bucket: config.s3.bucketName,
      Key: keyName,
      Body: JSON.stringify(rainCharts, null, 2),
    })

    response.status(200).json({
      success: true,
      bucket: config.s3.bucketName,
      fileName: keyName,
    })
  } else {
    response.status(400)
  }
}

export default regionCacheApi
