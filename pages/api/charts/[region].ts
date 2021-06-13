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

/*export interface ChartData {
  year: number
  month: number
  day: number
  hour: number
  utcDate: number
  issueDate: string
  forecastDate: string
  offset: number
}*/
export function decodeSrc(relativeUrl: string): ChartResponse {
  console.log(relativeUrl)

  // ./2021060500/rain-nz-2021060500-006.gif

  const regex =
    /(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})(?<hour>\d{2})-(?<offset>\d{3}).gif/gm

  const { groups } = regex.exec(relativeUrl)

  const year = +groups.year
  const month = +groups.month - 1
  const day = +groups.day
  const hour = +groups.hour
  const offset = +groups.offset

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
        'https://dpucyvo9dklo9.cloudfront.net'
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
