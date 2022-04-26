import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { decodeRainUrl } from '../url'
import { RainChartData } from '../rainChartData'
import { config } from '../../../config'

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
        width: element.attribs.width,
        height: element.attribs.height,
      }
    })
  } catch (e) {
    console.error(e)
  }
}
const region = async (req: NextApiRequest, res: NextApiResponse) => {
  let region = req.query['region']

  if (!region) region = 'nz'

  const rainCharts: RainChartData[] = await getImageUrls(
    Array.isArray(region) ? region[0] : region
  )
  res.status(200).json(rainCharts)
}

export default region
