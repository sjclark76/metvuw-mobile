import { collectScrapedImages } from '@/shared/helpers/v2/screenScraper/collectScrapedImages'
import { imagePipeline } from '@/shared/helpers/v2/screenScraper/imagePipeline'
import { loadImages } from '@/shared/helpers/v2/screenScraper/loadImages'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'

export const scrapeUpperAirImages = async (): Promise<ScrapedImage[]> => {
  const images = await loadImages('upperair', 'img[src$="thumb.png"]')

  return collectScrapedImages(
    images.map((image) =>
      imagePipeline(
        (relativeUrl) =>
          relativeUrl.replace('.', 'upperair').replace('.thumb', ''),
        (originalFileName, newFileName) => {
          const regex = /(?<date>\d+)\.(?<balloon>\d+).png/
          const balloonCode = originalFileName.match(regex)?.groups?.balloon
          if (!balloonCode) return undefined

          return {
            fullStoragePath: `images/upper-air/${balloonCode}/${newFileName}`,
            smallImageStoragePath: `small-images/upper-air/${balloonCode}/${newFileName}`,
          }
        },
      )(image),
    ),
    images,
    'upper air',
  )
}
