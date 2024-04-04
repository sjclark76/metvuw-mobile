import path from 'node:path'

import { config } from '@/config'
import { loadImages } from '@/shared/helpers/v2/screenScraper/loadImages'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'
import { Region } from '@/shared/types/region'

export const scrapeRainImages = async (
  region: Region,
): Promise<ScrapedImage[]> => {
  // ./2021060500/rain-nz-2021060500-006.gif
  const images = await loadImages(
    `forecast/forecast.php?type=rain&region=${region.code}&noofdays=10`,
    'img[src*=rain]',
  )

  return images.map((image) => {
    const transformedUrl = image.relativeUrl.replace('.', 'forecast')

    const absoluteURL = new URL(transformedUrl, config.metvuwBaseUrl)
    const originalFileName = path.basename(absoluteURL.pathname)
    const regionCode =
      originalFileName.match(
        /rain-(?<region>\w+)-thumb-(?<filename>\d+-\d+\.gif)/,
      )?.groups?.region ?? ''

    const fileExtension = path.extname(originalFileName)
    const newFileName = originalFileName.replace(fileExtension, '.webp')
    return {
      originalImageURL: absoluteURL,
      originalFileName: originalFileName,
      fullStoragePath: `images/rain/${regionCode}/${newFileName}`,
      imageFileName: newFileName,
    }
  })
}
