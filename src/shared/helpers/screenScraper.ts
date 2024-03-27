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
): Promise<T[]> {
  const images = await loadImages(url, imageSelector)

  return images.map((image: any) => {
    const relativeUrl = image.attribs.src

    return urlDecoder(relativeUrl, {
      width: +image.attribs.width,
      height: +image.attribs.height,
    })
  })
}

export const scrapeRadarImages = () => {
  return scrapeImages(
    'radar/radar.php?location=nz',
    'img[src*=images]',
    decodeRadarUrl,
  )
}
export const scrapeSatelliteImages = () =>
  scrapeImages('satellite', 'img[src*=small]', decodeSatelliteUrl)
export const scrapeUpperAirImages = () =>
  scrapeImages('upperair', 'img[src$="thumb.png"]', decodeUpperAirUrl)
export const scrapeRainImages = (region: Region) =>
  scrapeImages(
    `forecast/forecast.php?type=rain&region=${region.code}&noofdays=10`,
    'img[src*=rain]',
    decodeRainUrl,
  )
