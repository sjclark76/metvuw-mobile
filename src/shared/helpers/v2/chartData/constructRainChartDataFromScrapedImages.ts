import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'

export function constructRainChartDataFromScrapedImages(
  images: ScrapedImage[],
): SkinnyRainChartData[] {
  const regex =
    /rain-(?<region>\w+)-thumb-(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})(?<hour>\d{2})-(?<offset>\d{3}).webp/

  return images.map((image) => {
    const match = image.imageFileName.match(regex)?.groups || {}
    const getGroup = (groupName: string) => +match[groupName] || 0
    const [year, month, day, hour, offset] = [
      'year',
      'month',
      'day',
      'hour',
      'offset',
    ].map(getGroup)

    return {
      imageDateUTC: Date.UTC(year, month - 1, day, hour),
      url: image.originalImageURL,
      forecastDate: new Date(
        Date.UTC(year, month - 1, day, hour + offset),
      ).toISOString(),
    }
  })
}
