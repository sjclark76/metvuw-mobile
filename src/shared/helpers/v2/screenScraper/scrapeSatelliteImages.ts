import { imagePipeline } from '@/shared/helpers/v2/screenScraper/imagePipeline'
import { loadImages } from '@/shared/helpers/v2/screenScraper/loadImages'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'

export const scrapeSatelliteImages = async (): Promise<ScrapedImage[]> => {
  const images = await loadImages('satellite', 'img[src*=small]')

  return images.map((image) => {
    return imagePipeline(
      (relativeUrl) => relativeUrl.replace('./small', 'satellite/big'),
      (originalFileName, newFileName) => ({
        fullStoragePath: `images/satellite/${newFileName}`,
        smallImageStoragePath: `small-images/satellite/${newFileName}`,
      }),
    )(image)
  })
}
