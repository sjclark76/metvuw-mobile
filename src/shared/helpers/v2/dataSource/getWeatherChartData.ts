import { config } from '@/config'
import { SkinnyChartData } from '@/shared/helpers/v2/chartData/constructChartData'
import { constructChartData } from '@/shared/helpers/v2/chartData/constructChartData'
import { constructChartDataFromScrapedImages } from '@/shared/helpers/v2/chartData/constructChartDataFromScrapedImages'
import { constructRainChartData } from '@/shared/helpers/v2/chartData/constructRainChartData'
import { constructRainChartDataFromScrapedImages } from '@/shared/helpers/v2/chartData/constructRainChartDataFromScrapedImages'
import { buildFallbackImageProxyUrl } from '@/shared/helpers/v2/dataSource/fallbackImageProxyUrl'
import { retrieveImagesFromStorage } from '@/shared/helpers/v2/imageStorage'
import {
  scrapeRadarImages,
  scrapeRainImages,
  scrapeSatelliteImages,
  scrapeUpperAirImages,
} from '@/shared/helpers/v2/screenScraper'
import { ChartType } from '@/shared/types/ChartType'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

function sortByImageDateUTC<T extends { imageDateUTC: number }>(charts: T[]): T[] {
  return [...charts].sort((a, b) => a.imageDateUTC - b.imageDateUTC)
}

function mapToFallbackProxyUrls<T extends { url: string }>(
  charts: T[],
  chartType: ChartType,
): T[] {
  return charts.map((chart) => ({
    ...chart,
    url: buildFallbackImageProxyUrl({
      sourceUrl: chart.url,
      chartType,
      variant: 'primary',
    }),
  }))
}

export async function getRainChartDataForRegion(
  region: Region,
): Promise<SkinnyRainChartData[]> {
  if (config.directSourceMode) {
    const scrapedImages = await scrapeRainImages(region)
    const directSourceCharts = constructRainChartDataFromScrapedImages(scrapedImages)
    return sortByImageDateUTC(mapToFallbackProxyUrls(directSourceCharts, 'Rain'))
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

    const directSourceCharts = constructChartDataFromScrapedImages(filteredImages)
    return sortByImageDateUTC(mapToFallbackProxyUrls(directSourceCharts, 'Radar'))
  }

  const existingImages = await retrieveImagesFromStorage(`images/radar/${radarCode}`)
  return sortByImageDateUTC(constructChartData(existingImages))
}

export async function getSatelliteChartData(): Promise<SkinnyChartData[]> {
  if (config.directSourceMode) {
    const scrapedImages = await scrapeSatelliteImages()
    const directSourceCharts = constructChartDataFromScrapedImages(scrapedImages)
    return sortByImageDateUTC(
      mapToFallbackProxyUrls(directSourceCharts, 'Satellite'),
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

    const directSourceCharts = constructChartDataFromScrapedImages(filteredImages)
    return sortByImageDateUTC(
      mapToFallbackProxyUrls(directSourceCharts, 'Upper Air'),
    )
  }

  const existingImages = await retrieveImagesFromStorage(
    `images/upper-air/${balloonCode}`,
  )
  return sortByImageDateUTC(constructChartData(existingImages))
}
