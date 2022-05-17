import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { RainChartData } from '../types/rainChartData'
import { config } from '../../../config'
import { decodeRainUrl } from '../helpers/urlHelper'
import { buildKeyName, s3upload } from '../helpers/s3Helper'

export async function getImageUrls(region: string): Promise<RainChartData[]> {
  try {
    const url = new URL(
      `forecast/forecast.php?type=rain&region=${region}&noofdays=10`,
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
  } catch (e) {
    console.error(e)
  }
}

const region = async (req: NextApiRequest, res: NextApiResponse) => {
  let region = req.query['region']

  if (!region) region = 'nz'

  const regionName = Array.isArray(region) ? region[0] : region
  const rainCharts: RainChartData[] = await getImageUrls(regionName)

  const keyName = buildKeyName(regionName)

  await s3upload({
    Bucket: config.bucketName,
    Key: keyName,
    Body: JSON.stringify(rainCharts, null, 2),
  })

  res.status(200).json({
    success: true,
    fileName: keyName,
  })
}

export default region
