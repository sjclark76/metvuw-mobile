import path from 'node:path'

import { config } from '@/config'
import { loadImages } from '@/shared/helpers/v2/screenScraper/loadImages'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'

export const scrapeRadarImages = async (): Promise<ScrapedImage[]> => {
  const images = await loadImages(
    'radar/radar.php?location=nz',
    'img[src*=images]',
  )

  return images.map((image) => {
    const transformedUrl = image.relativeUrl.replace('.', 'radar')
    const absoluteURL = new URL(transformedUrl, config.metvuwBaseUrl)
    const originalFileName = path.basename(absoluteURL.pathname)
    const radarCode =
      originalFileName.match(/\d+\w_(?<radar>\w+).gif/)?.groups?.radar ?? ''
    return {
      originalImageURL: absoluteURL,
      originalFileName: originalFileName,
      fullStoragePath: `radar/${radarCode}/${originalFileName}`,
      storagePath: `radar/${radarCode}`,
    }
  })
}
