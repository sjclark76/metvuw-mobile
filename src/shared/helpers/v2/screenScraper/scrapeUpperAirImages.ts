import path from 'node:path'

import { config } from '@/config'
import { loadImages } from '@/shared/helpers/v2/screenScraper/loadImages'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'

export const scrapeUpperAirImages = async (): Promise<ScrapedImage[]> => {
  const images = await loadImages('upperair', 'img[src$="thumb.png"]')

  return images.map((image) => {
    const transformedUrl = image.relativeUrl
      .replace('.', 'upperair')
      .replace('.thumb', '')

    const regex = /(?<date>\d+)\.(?<balloon>\d+).png/
    const absoluteURL = new URL(transformedUrl, config.metvuwBaseUrl)
    const originalFileName = path.basename(absoluteURL.pathname)

    const balloonCode = originalFileName.match(regex)?.groups?.balloon ?? ''

    return {
      originalImageURL: absoluteURL,
      originalFileName: originalFileName,
      fullStoragePath: `images/upper-air/${balloonCode}/${originalFileName}`,
      imageFileName: `images/upper-air/${balloonCode}`,
    }
  })
}
