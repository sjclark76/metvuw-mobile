import axios from 'axios'
import cheerio from 'cheerio'

import { config } from '@/config'
import {
  decodeRadarUrl,
  decodeRainUrl,
  decodeSatelliteUrl,
  decodeUpperAirUrl,
  UrlDecoder,
} from '@/shared/helpers/urlDecoder'
import { ChartData } from '@/shared/types/chartData'
import { Region } from '@/shared/types/region'

async function loadImages(
  url: string,
  imageSelector: string,
): Promise<cheerio.Element[]> {
  const response = await axios.get(new URL(url, config.metvuwBaseUrl).href)
  let rawHtml = response.data

  const $ = cheerio.load(rawHtml)

  const images: cheerio.Cheerio = $(imageSelector)

  return images.toArray()
}

async function scrapeImages<T extends ChartData>(
  url: string,
  imageSelector: string,
  urlDecoder: UrlDecoder<T>,
  path: string,
): Promise<T[]> {
  const images = await loadImages(url, imageSelector)

  return images.map((element: any) => {
    const relativeUrl = element.attribs.src

    const url = new URL(
      `${path}/${relativeUrl.substring(path.length + 1)}`,
      config.cloudFrontUrl,
    )

    return urlDecoder(relativeUrl, {
      url: url.href,
      width: +element.attribs.width,
      height: +element.attribs.height,
    })
  })
}

export const scrapeRadarImages = () =>
  scrapeImages(
    'radar/radar.php?location=nz',
    'img[src*=images]',
    decodeRadarUrl,
    'radar/images',
  )
export const scrapeSatelliteImages = () =>
  scrapeImages(
    'satellite',
    'img[src*=small]',
    decodeSatelliteUrl,
    'satellite/big',
  )
export const scrapeUpperAirImages = () =>
  scrapeImages(
    'upperair',
    'img[src$="thumb.png"]',
    decodeUpperAirUrl,
    'upperair',
  )
export const scrapeRainImages = (region: Region) =>
  scrapeImages(
    `forecast/forecast.php?type=rain&region=${region.code}&noofdays=10`,
    'img[src*=rain]',
    decodeRainUrl,
    'forecast',
  )
