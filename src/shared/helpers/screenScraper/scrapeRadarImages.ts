import { collectScrapedImages } from '@/shared/helpers/screenScraper/collectScrapedImages'
import { imagePipeline } from '@/shared/helpers/screenScraper/imagePipeline'
import { loadImages } from '@/shared/helpers/screenScraper/loadImages'
import { ScrapedImage } from '@/shared/helpers/screenScraper/scrapedImage'

export const scrapeRadarImages = async (): Promise<ScrapedImage[]> => {
  const images = await loadImages(
    'radar/radar.php?location=nz',
    'img[src*=images]',
  )

  return collectScrapedImages(
    images.map((image) =>
      imagePipeline(
        (relativeUrl) => relativeUrl.replace('.', 'radar'),
        (originalFileName, newFileName) => {
          const radarCode = originalFileName.match(/\d+\w_(?<radar>\w+).gif/)
            ?.groups?.radar
          if (!radarCode) return undefined

          return {
            fullStoragePath: `images/radar/${radarCode}/${newFileName}`,
          }
        },
      )(image),
    ),
    images,
    'radar',
  )
}
