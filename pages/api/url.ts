import { RainChartData } from './rainChartData'
import { SatelliteChartData } from './satelliteChartData'

export const metvuwBaseUrl = 'https://www.metvuw.com/'

export function decodeRainUrl(relativeUrl: string): RainChartData {
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

export function decodeSatelliteUrl(relativeUrl: string): SatelliteChartData {
  // ./small/202109240000.jpg

  const slice = relativeUrl.slice(-17).slice(0, 12)

  const year = +slice.slice(0, 4) // +groups.year
  const month = +slice.slice(4, 6) - 1 //+groups.month - 1
  const day = +slice.slice(6, 8) // +groups.day
  const hour = +slice.slice(8, 10) //+groups.hour
  return {
    year: year,
    month: month,
    day: day,
    hour: hour,
    imageDate: Date.UTC(year, month, day, hour),
    imageDateIso: new Date(Date.UTC(year, month, day, hour)).toISOString(),
  }
}
