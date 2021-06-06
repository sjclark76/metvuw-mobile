import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import * as cheerio from 'cheerio'

export interface ChartResponse {
  url: string
  width: number
  height: number
  issueDate: string
  forecastDate: string
  offset: number
}

export interface chartData {
  issueDate: string
  forecastDate: string
  offset: number
}
export function decodeSrc(relativeUrl: string): chartData {
  // ./2021060500/rain-nz-2021060500-006.gif

  const substring = relativeUrl.substr(21, 14) //2021060418-006
  const year = +substring.substr(0, 4)
  const month = +substring.substr(4, 2) - 1
  const day = +substring.substr(6, 2)
  const hour = +substring.substr(8, 2)
  const offset = +substring.substr(11, 3)

  return {
    issueDate: new Date(Date.UTC(year, month, day, hour)).toUTCString(),
    forecastDate: new Date(
      Date.UTC(year, month, day, hour + offset)
    ).toUTCString(),
    offset: offset,
  }
}

export async function getImageUrls(region: string): Promise<ChartResponse[]> {
  try {
    const response = await axios.get(
      `http://www.metvuw.com/forecast/forecast.php?type=rain&region=${region}&noofdays=10`
    )

    let rawHtml = response.data

    const $ = cheerio.load(rawHtml)

    const images: cheerio.Cheerio = $('img[src*=rain]')

    return images.toArray().map((element: any) => {
      const relativeUrl = element.attribs.src
      const decodedSrc = decodeSrc(relativeUrl)
      const url = new URL(
        `forecast/${relativeUrl.substr(2)}`,
        'https://dpucyvo9dklo9.cloudfront.net'
      )
      return {
        url: url.href,
        width: element.attribs.width,
        height: element.attribs.height,
        ...decodedSrc,
      }
    })
  } catch (e) {
    console.log(e)
  }
}
export default async (req: NextApiRequest, res: NextApiResponse) => {
  let region = req.query['region']

  if (!region) region = 'nz'

  const charts: ChartResponse[] = await getImageUrls(
    Array.isArray(region) ? region[0] : region
  )
  res.status(200).json(charts)
}
