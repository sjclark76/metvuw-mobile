import { parseUtcDate } from '@/shared/helpers/v2/chartData/parseUtcDate'
import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'
import { ScrapeError } from '@/shared/helpers/v2/screenScraper/scrapeError'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'

const fileNamePattern =
  /rain-(?<region>\w+)-thumb-(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})(?<hour>\d{2})-(?<offset>\d{3}).webp/

/**
 * Builds chart data from scraped rain images. A filename that doesn't match, or
 * encodes an impossible date, is reported and skipped rather than shown with an
 * invented date. If images were scraped but none can be parsed, the naming
 * scheme has changed, so this throws.
 */
export function constructRainChartDataFromScrapedImages(
  images: ScrapedImage[],
): SkinnyRainChartData[] {
  const charts = images.flatMap((image): SkinnyRainChartData[] => {
    const groups = image.imageFileName.match(fileNamePattern)?.groups
    const imageDateUTC =
      groups &&
      parseUtcDate(+groups.year, +groups.month, +groups.day, +groups.hour)

    if (!groups || imageDateUTC === undefined) {
      // eslint-disable-next-line no-console
      console.warn(
        `skipping rain chart with unparseable name: ${image.imageFileName}`,
      )
      return []
    }

    return [
      {
        imageDateUTC,
        url: image.originalImageURL,
        forecastDate: new Date(
          imageDateUTC + +groups.offset * 3_600_000,
        ).toISOString(),
      },
    ]
  })

  if (images.length > 0 && charts.length === 0) {
    throw new ScrapeError(
      'none of the scraped rain charts have a parseable name',
    )
  }
  return charts
}
