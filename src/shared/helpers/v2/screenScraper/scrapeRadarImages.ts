import { imagePipeline } from '@/shared/helpers/v2/screenScraper/imagePipeline'
import { loadImages } from '@/shared/helpers/v2/screenScraper/loadImages'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'

export const scrapeRadarImages = async (): Promise<ScrapedImage[]> => {
  const images = await loadImages(
    'radar/radar.php?location=nz',
    'img[src*=images]',
  )

  return images.map((image) => {
    return imagePipeline(
      (relativeUrl) => relativeUrl.replace('.', 'radar'),
      (originalFileName, newFileName) => {
        const radarCode =
          originalFileName.match(/\d+\w_(?<radar>\w+).gif/)?.groups?.radar ?? ''
        return {
          fullStoragePath: `images/radar/${radarCode}/${newFileName}`,
        }
      },
    )(image)
  })
}
