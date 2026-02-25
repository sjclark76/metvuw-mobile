import { config } from '@/config'
import { SkinnyChartData } from '@/shared/helpers/v2/chartData/constructChartData'
import { constructChartData } from '@/shared/helpers/v2/chartData/constructChartData'
import { constructChartDataFromScrapedImages } from '@/shared/helpers/v2/chartData/constructChartDataFromScrapedImages'
import { constructRainChartData } from '@/shared/helpers/v2/chartData/constructRainChartData'
import { constructRainChartDataFromScrapedImages } from '@/shared/helpers/v2/chartData/constructRainChartDataFromScrapedImages'
import { retrieveImagesFromStorage } from '@/shared/helpers/v2/imageStorage'
import {
  scrapeRadarImages,
  scrapeRainImages,
  scrapeSatelliteImages,
  scrapeUpperAirImages,
} from '@/shared/helpers/v2/screenScraper'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

function sortByImageDateUTC<T extends { imageDateUTC: number }>(charts: T[]): T[] {
  return [...charts].sort((a, b) => a.imageDateUTC - b.imageDateUTC)
}

export async function getRainChartDataForRegion(
  region: Region,
): Promise<SkinnyRainChartData[]> {
  if (config.directSourceMode) {
    const scrapedImages = await scrapeRainImages(region)
    return sortByImageDateUTC(
      constructRainChartDataFromScrapedImages(scrapedImages),
    )
  }

  const existingImages = await retrieveImagesFromStorage(`images/rain/${region.code}`)
  return sortByImageDateUTC(constructRainChartData(existingImages))
}

export async function getRadarChartDataForCode(
  radarCode: string,
): Promise<SkinnyChartData[]> {
  if (config.directSourceMode) {
    const scrapedImages = await scrapeRadarImages()
    const filteredImages = scrapedImages.filter((image) =>
      image.fullStoragePath.startsWith(`images/radar/${radarCode}/`),
    )

    return sortByImageDateUTC(
      constructChartDataFromScrapedImages(filteredImages),
    )
  }

  const existingImages = await retrieveImagesFromStorage(`images/radar/${radarCode}`)
  return sortByImageDateUTC(constructChartData(existingImages))
}

export async function getSatelliteChartData(): Promise<SkinnyChartData[]> {
  if (config.directSourceMode) {
    const scrapedImages = await scrapeSatelliteImages()
    return sortByImageDateUTC(
      constructChartDataFromScrapedImages(scrapedImages),
    )
  }

  const existingImages = await retrieveImagesFromStorage('images/satellite')
  return sortByImageDateUTC(constructChartData(existingImages))
}

export async function getUpperAirChartDataForCode(
  balloonCode: string,
): Promise<SkinnyChartData[]> {
  if (config.directSourceMode) {
    const scrapedImages = await scrapeUpperAirImages()
    const filteredImages = scrapedImages.filter((image) =>
      image.fullStoragePath.startsWith(`images/upper-air/${balloonCode}/`),
    )

    return sortByImageDateUTC(
      constructChartDataFromScrapedImages(filteredImages),
    )
  }

  const existingImages = await retrieveImagesFromStorage(
    `images/upper-air/${balloonCode}`,
  )
  return sortByImageDateUTC(constructChartData(existingImages))
}
