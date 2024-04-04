import { imagePipeline } from '@/shared/helpers/v2/screenScraper/imagePipeline'
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
    return imagePipeline(
      (relativeUrl) => relativeUrl.replace('.', 'forecast'),
      (originalFileName, newFileName) => {
        const regionCode =
          originalFileName.match(
            /rain-(?<region>\w+)-thumb-(?<filename>\d+-\d+\.gif)/,
          )?.groups?.region ?? ''

        return {
          fullStoragePath: `images/rain/${regionCode}/${newFileName}`,
        }
      },
    )(image)
  })
}
