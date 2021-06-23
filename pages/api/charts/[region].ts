import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import * as cheerio from 'cheerio'

export interface ChartResponse {
  url?: string
  year?: number
  month?: number
  day?: number
  hour?: number
  width?: number
  height?: number
  utcDate?: number
  issueDate?: string
  forecastDate?: string
  offset?: number
}

export function decodeSrc(relativeUrl: string): ChartResponse {
  console.log(relativeUrl)

  // ./2021060500/rain-nz-2021060500-006.gif

  const slice = relativeUrl.slice(-18).slice(0, 14)

  const year = +slice.slice(0, 4) // +groups.year
  const month = +slice.slice(4, 6) - 1 //+groups.month - 1
  const day = +slice.slice(6, 8) // +groups.day
  const hour = +slice.slice(8, 10) //+groups.hour
  const offset = +slice.slice(11, 14) //+ groups.offset
  return {
    year: year,
    month: month,
    day: day,
    hour: hour,
    utcDate: Date.UTC(year, month, day, hour),
    issueDate: new Date(Date.UTC(year, month, day, hour)).toISOString(),
    forecastDate: new Date(
      Date.UTC(year, month, day, hour + offset)
    ).toISOString(),
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
        //'https://dpucyvo9dklo9.cloudfront.net'
        'http://www.metvuw.com'
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

  const charts: ChartResponse[] = await getImageUrls(
    Array.isArray(region) ? region[0] : region
  )
  res.status(200).json(charts)
}
