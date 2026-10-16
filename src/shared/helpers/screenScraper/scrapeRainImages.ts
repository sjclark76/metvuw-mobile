import { collectScrapedImages } from '@/shared/helpers/screenScraper/collectScrapedImages'
import { imagePipeline } from '@/shared/helpers/screenScraper/imagePipeline'
import { loadImages } from '@/shared/helpers/screenScraper/loadImages'
import { ScrapedImage } from '@/shared/helpers/screenScraper/scrapedImage'
import { Region } from '@/shared/types/region'

export const scrapeRainImages = async (
  region: Region,
): Promise<ScrapedImage[]> => {
  // ./2021060500/rain-nz-2021060500-006.gif
  const images = await loadImages(
    `forecast/forecast.php?type=rain&region=${region.code}&noofdays=10`,
    'img[src*=rain]',
  )

  return collectScrapedImages(
    images.map((image) =>
      imagePipeline(
        (relativeUrl) => relativeUrl.replace('.', 'forecast'),
        (originalFileName, newFileName) => {
          const regionCode = originalFileName.match(
            /rain-(?<region>\w+)-thumb-(?<filename>\d+-\d+\.gif)/,
          )?.groups?.region
          if (!regionCode) return undefined

          return {
            fullStoragePath: `images/rain/${regionCode}/${newFileName}`,
          }
        },
      )(image),
    ),
    images,
    'rain',
  )
}
