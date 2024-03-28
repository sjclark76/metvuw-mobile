import path from 'node:path'

import { config } from '@/config'
import { loadImages } from '@/shared/helpers/v2/screenScraper/loadImages'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'

export const scrapeSatelliteImages = async (): Promise<ScrapedImage[]> => {
  const images = await loadImages('satellite', 'img[src*=small]')

  return images.map((image) => {
    const transformedUrl = image.relativeUrl.replace('./small', 'satellite/big')
    const absoluteURL = new URL(transformedUrl, config.metvuwBaseUrl)
    return {
      originalImageURL: absoluteURL,
      originalFileName: path.basename(absoluteURL.pathname),
      width: image.width,
      height: image.height,
    }
  })
}
