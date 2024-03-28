import path from 'node:path'

import { config } from '@/config'
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
  dimensions: { width: number; height: number }, // eslint-disable-line
) => T

function extractFilename(relativeUrl: string, regex: RegExp): string {
  const match = relativeUrl.match(regex)
  return match?.groups?.filename ?? ''
}

function constructChartData(
  fileName: string,
  absoluteURL: URL,
  dimensions: { width: number; height: number },
): ChartData {
  const year = +fileName.slice(0, 4)
  const month = +fileName.slice(4, 6) - 1
  const day = +fileName.slice(6, 8)
  const hour = +fileName.slice(8, 10)
  const utcDate = Date.UTC(year, month, day, hour)
  const originalFileName = path.basename(absoluteURL.pathname)

  return {
    day: day,
    hour: hour,
    imageDateISO: new Date(utcDate).toISOString(),
    imageDateUTC: utcDate,
    month: month,
    name: originalFileName,
    path: originalFileName,
    url: absoluteURL.href,
    ...dimensions,
    year: year,
  }
}

function decodeUrl<T extends ChartData>(
  relativeUrl: string,
  absoluteURL: URL,
  dimensions: { width: number; height: number },
  regex: RegExp,
  additionalProcessing: (fileName: string, chartData: ChartData) => T, // eslint-disable-line
): T {
  const filename = extractFilename(relativeUrl, regex)

  const chartData = constructChartData(filename, absoluteURL, dimensions)

  return additionalProcessing(filename, chartData)
}

export function decodeRainUrl(
  relativeUrl: string,
  dimensions: { width: number; height: number },
): RainChartData {
  // ./2021060500/rain-nz-2021060500-006.gif

  const regex = /\.\/\d+\/rain-(?<region>\w+)-thumb-(?<filename>\d+-\d+\.gif)/

  const match = relativeUrl.match(regex)
  const region = match?.groups?.region ?? ''

  const transformedUrl = relativeUrl.replace('.', 'forecast')
  const absoluteURL = new URL(transformedUrl, config.metvuwBaseUrl)
  return decodeUrl<RainChartData>(
    relativeUrl,
    absoluteURL,
    dimensions,
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
        path: `rain/${region}/${chartData.name}`,
      }
    },
  )
}

export function decodeSatelliteUrl(
  relativeUrl: string,
  dimensions: { width: number; height: number },
): ChartData {
  // ./small/202109240000.jpg

  const regex = /\.\/\w+\/(?<filename>\d+\.jpg)/

  const transformedUrl = relativeUrl.replace('./small', 'satellite/big')
  const absoluteURL = new URL(transformedUrl, config.metvuwBaseUrl)

  return decodeUrl<ChartData>(
    relativeUrl,
    absoluteURL,
    dimensions,
    regex,
    (_filename, chartData) => ({
      ...chartData,
      path: `satellite/${chartData.name}`,
    }),
  )
}

export function decodeRadarUrl(
  relativeUrl: string,
  dimensions: { width: number; height: number },
): RadarChartData {
  // ./images/202308271500Z_nl.gif

  const regex = /\.\/\w+\/(?<filename>\d+\w+.gif)/

  const transformedUrl = relativeUrl.replace('.', 'radar')
  const absoluteURL = new URL(transformedUrl, config.metvuwBaseUrl)

  return decodeUrl<RadarChartData>(
    relativeUrl,
    absoluteURL,
    dimensions,
    regex,
    (filename, chartData) => {
      const radar =
        filename.match(/\d+\w_(?<radar>\w+).gif/)?.groups?.radar ?? ''
      return {
        ...chartData,
        radar: radarRegions[radar],
        radarCode: radar as RadarCode,
        path: `radar/${radar}/${chartData.name}`,
      }
    },
  )
}

export function decodeUpperAirUrl(
  relativeUrl: string,
  dimensions: { width: number; height: number },
): UpperAirChartData {
  // ./202308301200.93112.thumb.png

  const regex = /\.\/(?<filename>\d+)\.(?<balloon>\d+).thumb.png/

  const transformedUrl = relativeUrl
    .replace('.', 'upperair')
    .replace('.thumb', '')

  const absoluteURL = new URL(transformedUrl, config.metvuwBaseUrl)

  return decodeUrl<UpperAirChartData>(
    relativeUrl,
    absoluteURL,
    dimensions,
    regex,
    (_filename, chartData) => {
      const balloonLocationCode =
        relativeUrl.match(regex)?.groups?.balloon ?? ''

      return {
        ...chartData,
        balloonLocation: balloonLocations[balloonLocationCode],
        balloonLocationCode: balloonLocationCode as BalloonLocationCode,
        path: `upper-air/${balloonLocationCode}/${chartData.name}`,
      }
    },
  )
}
