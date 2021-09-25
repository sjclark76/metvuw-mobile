import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { decodeRainUrl, metvuwBaseUrl } from '../url'
import { RainChartData } from '../rainChartData'

export async function getImageUrls(region: string): Promise<RainChartData[]> {
  try {
    const url = new URL(
      `forecast/forecast.php?type=rain&region=${region}&noofdays=10`,
      metvuwBaseUrl
    )
    const response = await axios.get(url.href)

    let rawHtml = response.data

    const $ = cheerio.load(rawHtml)

    const images: cheerio.Cheerio = $('img[src*=rain]')

    return images.toArray().map((element: any) => {
      const relativeUrl = element.attribs.src
      const decodedSrc = decodeRainUrl(relativeUrl)
      const url = new URL(
        `forecast/${relativeUrl.substr(2)}`,
        //'https://dpucyvo9dklo9.cloudfront.net'
        metvuwBaseUrl
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
export default async (req: NextApiRequest, res: NextApiResponse) => {
  let region = req.query['region']

  if (!region) region = 'nz'

  const rainCharts: RainChartData[] = await getImageUrls(
    Array.isArray(region) ? region[0] : region
  )
  res.status(200).json(rainCharts)
}
