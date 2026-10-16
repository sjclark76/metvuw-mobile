import { constructChartDataFromScrapedImages } from '@/shared/helpers/chartData/constructChartDataFromScrapedImages'
import { constructRainChartDataFromScrapedImages } from '@/shared/helpers/chartData/constructRainChartDataFromScrapedImages'
import { buildFallbackImageProxyUrl } from '@/shared/helpers/dataSource/fallbackImageProxyUrl'
import {
  scrapeRadarImages,
  scrapeRainImages,
  scrapeSatelliteImages,
  scrapeUpperAirImages,
} from '@/shared/helpers/screenScraper'
import { SkinnyChartData } from '@/shared/types/chartData'
import { ChartType } from '@/shared/types/ChartType'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

function sortByImageDateUTC<T extends { imageDateUTC: number }>(
  charts: T[],
): T[] {
  return [...charts].sort((a, b) => a.imageDateUTC - b.imageDateUTC)
}

// Chart images are served through our proxy, which crops and compresses them.
function mapToProxyUrls<T extends { url: string }>(
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
  const scrapedImages = await scrapeRainImages(region)
  const charts = constructRainChartDataFromScrapedImages(scrapedImages)
  return sortByImageDateUTC(mapToProxyUrls(charts, 'Rain'))
}

export async function getRadarChartDataForCode(
  radarCode: string,
): Promise<SkinnyChartData[]> {
  const scrapedImages = await scrapeRadarImages()
  const filteredImages = scrapedImages.filter((image) =>
    image.fullStoragePath.startsWith(`images/radar/${radarCode}/`),
  )

  const charts = constructChartDataFromScrapedImages(filteredImages)
  return sortByImageDateUTC(mapToProxyUrls(charts, 'Radar'))
}

export async function getSatelliteChartData(): Promise<SkinnyChartData[]> {
  const scrapedImages = await scrapeSatelliteImages()
  const charts = constructChartDataFromScrapedImages(scrapedImages)
  return sortByImageDateUTC(mapToProxyUrls(charts, 'Satellite'))
}

export async function getUpperAirChartDataForCode(
  balloonCode: string,
): Promise<SkinnyChartData[]> {
  const scrapedImages = await scrapeUpperAirImages()
  const filteredImages = scrapedImages.filter((image) =>
    image.fullStoragePath.startsWith(`images/upper-air/${balloonCode}/`),
  )

  const charts = constructChartDataFromScrapedImages(filteredImages)
  return sortByImageDateUTC(mapToProxyUrls(charts, 'Upper Air'))
}
