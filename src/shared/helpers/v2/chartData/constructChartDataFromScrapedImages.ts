import { ScrapedImage } from '@/shared/helpers/v2/screenScraper/scrapedImage'

import { SkinnyChartData } from './constructChartData'

export function constructChartDataFromScrapedImages(
  images: ScrapedImage[],
): SkinnyChartData[] {
  return images.map((image) => {
    const fileName = image.imageFileName
    const year = +fileName.slice(0, 4)
    const month = +fileName.slice(4, 6) - 1
    const day = +fileName.slice(6, 8)
    const hour = +fileName.slice(8, 10)

    return {
      imageDateUTC: Date.UTC(year, month, day, hour),
      url: image.originalImageURL,
    }
  })
}
