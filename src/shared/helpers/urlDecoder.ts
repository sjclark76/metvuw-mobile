import { ChartData } from '@/shared/types/chartData'
import { RadarChartData } from '@/shared/types/radarChartData'
import { RainChartData } from '@/shared/types/rainChartData'
import { UpperAirChartData } from '@/shared/types/upperAirChartData'

import {
  BalloonLocationCode,
  balloonLocations,
} from '../types/balloonLocations'
import { RadarCode, radarRegions } from '../types/radarRegions'

// eslint-disable-no-unused-vars
export type UrlDecoder<T extends ChartData> = (
  relativeUrl: string, // eslint-disable-line
  attributes: { url: string; width: number; height: number }, // eslint-disable-line
) => T

function extractFilename(relativeUrl: string, regex: RegExp): string {
  const match = relativeUrl.match(regex)
  return match?.groups?.filename ?? ''
}

function constructChartData(
  fileName: string,
  attributes: { url: string; width: number; height: number },
): ChartData {
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
    ...attributes,
  }
}

function decodeUrl<T extends ChartData>(
  relativeUrl: string,
  attributes: { url: string; width: number; height: number },
  regex: RegExp,
  additionalProcessing: (fileName: string, chartData: ChartData) => T, // eslint-disable-line
): T {
  const filename = extractFilename(relativeUrl, regex)

  const chartData = constructChartData(filename, attributes)

  return additionalProcessing(filename, chartData)
}

export function decodeRainUrl(
  relativeUrl: string,
  attributes: { url: string; width: number; height: number },
): RainChartData {
  // ./2021060500/rain-nz-2021060500-006.gif

  const regex = /\.\/\d+\/rain-\w+-thumb-(?<filename>\d+-\d+\.gif)/

  return decodeUrl<RainChartData>(
    relativeUrl,
    attributes,
    regex,
    (filename, chartData) => {
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
    },
  )
}

export function decodeSatelliteUrl(
  relativeUrl: string,
  attributes: { url: string; width: number; height: number },
): ChartData {
  // ./small/202109240000.jpg

  const regex = /\.\/\w+\/(?<filename>\d+\.jpg)/

  return decodeUrl<ChartData>(
    relativeUrl,
    attributes,
    regex,
    (_filename, chartData) => chartData,
  )
}

export function decodeRadarUrl(
  relativeUrl: string,
  attributes: { url: string; width: number; height: number },
): RadarChartData {
  // ./images/202308271500Z_nl.gif

  const regex = /\.\/\w+\/(?<filename>\d+\w+.gif)/

  return decodeUrl<RadarChartData>(
    relativeUrl,
    attributes,
    regex,
    (filename, chartData) => {
      const radar =
        filename.match(/\d+\w_(?<radar>\w+).gif/)?.groups?.radar ?? ''
      return {
        ...chartData,
        radarCode: radar as RadarCode,
        radar: radarRegions[radar],
      }
    },
  )
}

export function decodeUpperAirUrl(
  relativeUrl: string,
  attributes: { url: string; width: number; height: number },
): UpperAirChartData {
  // ./202308301200.93112.thumb.png

  const regex = /\.\/(?<filename>\d+)\.(?<balloon>\d+).thumb.png/

  return decodeUrl<UpperAirChartData>(
    relativeUrl,
    attributes,
    regex,
    (_filename, chartData) => {
      const balloonLocationCode =
        relativeUrl.match(regex)?.groups?.balloon ?? ''

      return {
        ...chartData,
        balloonLocationCode: balloonLocationCode as BalloonLocationCode,
        balloonLocation: balloonLocations[balloonLocationCode],
      }
    },
  )
}
