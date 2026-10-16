import { parseUtcDate } from '@/shared/helpers/chartData/parseUtcDate'
import { ScrapedImage } from '@/shared/helpers/screenScraper/scrapedImage'
import { ScrapeError } from '@/shared/helpers/screenScraper/scrapeError'
import { SkinnyChartData } from '@/shared/types/chartData'

const fileNamePattern =
  /^(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})(?<hour>\d{2})/

/**
 * Builds chart data from scraped radar, satellite and upper-air images, which
 * are named `YYYYMMDDHH...`. A filename without a valid date is reported and
 * skipped instead of becoming a NaN date. If images were scraped but none can
 * be parsed, the naming scheme has changed, so this throws.
 */
export function constructChartDataFromScrapedImages(
  images: ScrapedImage[],
): SkinnyChartData[] {
  const charts = images.flatMap((image): SkinnyChartData[] => {
    const groups = image.imageFileName.match(fileNamePattern)?.groups
    const imageDateUTC =
      groups &&
      parseUtcDate(+groups.year, +groups.month, +groups.day, +groups.hour)

    if (imageDateUTC === undefined) {
      // eslint-disable-next-line no-console
      console.warn(
        `skipping chart with unparseable name: ${image.imageFileName}`,
      )
      return []
    }

    return [{ imageDateUTC, url: image.originalImageURL }]
  })

  if (images.length > 0 && charts.length === 0) {
    throw new ScrapeError('none of the scraped charts have a parseable name')
  }
  return charts
}
