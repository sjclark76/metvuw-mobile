import { RainChartData } from '../types/rainChartData'
import { ChartData } from '../types/chartData'
import { RadarChartData } from '../types/radarChartData'
import { RadarCode, radarRegions } from '../../../shared/radarRegions'
import { UpperAirChartData } from '../types/upperAirChartData'
import {
  BalloonLocationCode,
  balloonLocations,
} from '../../../shared/balloonLocations'

function extractFilename(relativeUrl: string, regex: RegExp): string {
  const match = relativeUrl.match(regex)
  return match?.groups?.filename ?? ''
}

function constructChartData(
  fileName: string,
): Omit<ChartData, 'url' | 'width' | 'height'> {
  const year = +fileName.slice(0, 4)
  const month = +fileName.slice(4, 6) - 1
  const day = +fileName.slice(6, 8)
  const hour = +fileName.slice(8, 10)
  const utcDate = Date.UTC(year, month, day, hour)
  return {
    year: year,
    month: month,
    day: day,
    hour: hour,
    imageDateUTC: utcDate,
    imageDateISO: new Date(utcDate).toISOString(),
  }
}
export function decodeRainUrl(
  relativeUrl: string,
): Omit<RainChartData, 'url' | 'width' | 'height'> {
  // ./2021060500/rain-nz-2021060500-006.gif

  const regex = /\.\/\d+\/rain-\w+-thumb-(?<filename>\d+-\d+\.gif)/
  const filename = extractFilename(relativeUrl, regex)

  const chartData = constructChartData(filename)

  const offset = +filename.slice(11, 14)

  return {
    ...chartData,
    forecastDate: new Date(
      Date.UTC(
        chartData.year,
        chartData.month,
        chartData.day,
        chartData.hour + offset,
      ),
    ).toISOString(),
    offset: offset,
  }
}

export function decodeSatelliteUrl(
  relativeUrl: string,
): Omit<ChartData, 'url' | 'width' | 'height'> {
  // ./small/202109240000.jpg

  const regex = /\.\/\w+\/(?<filename>\d+\.jpg)/
  const filename = extractFilename(relativeUrl, regex)

  const chartData = constructChartData(filename)

  return {
    ...chartData,
  }
}

export function decodeRadarUrl(
  relativeUrl: string,
): Omit<RadarChartData, 'url' | 'width' | 'height'> {
  // ./images/202308271500Z_nl.gif

  const regex = /\.\/\w+\/(?<filename>\d+\w+.gif)/
  const filename = extractFilename(relativeUrl, regex)
  const radar = filename.match(/\d+\w_(?<radar>\w+).gif/)?.groups?.radar ?? ''
  const chartData = constructChartData(filename)

  return {
    ...chartData,
    radarCode: radar as RadarCode,
    radar: radarRegions[radar],
  }
}

export function decodeUpperAirUrl(
  relativeUrl: string,
): Omit<UpperAirChartData, 'url' | 'width' | 'height'> {
  // ./202308301200.93112.thumb.png

  const regex = /\.\/(?<date>\d+)\.(?<balloon>\d+).thumb.png/
  const regexMatch = relativeUrl.match(regex)
  const date = regexMatch?.groups?.date ?? ''
  const balloonLocationCode = regexMatch?.groups?.balloon ?? ''
  const chartData = constructChartData(date)

  return {
    ...chartData,
    balloonLocationCode: balloonLocationCode as BalloonLocationCode,
    balloonLocation: balloonLocations[balloonLocationCode],
  }
}
