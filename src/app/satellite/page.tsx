import { Metadata } from 'next'

import RadarAndSatelliteImages from '@/components/RadarAndSatelliteImages'
import { config } from '@/config'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { constructChartData } from '@/shared/helpers/v2/chartData/constructChartData'
import { retrieveLatestImagesFromStorage } from '@/shared/helpers/v2/imageStorage'

export const dynamic = 'force-dynamic'

export const generateMetadata = async (): Promise<Metadata> =>
  generateSEOMetadata({
    description: `Satellite wind & rain forecast charts. Optimized for mobile devices. Sourced from metvuw.com`,
    title: `metvuw mobile | Satellite`,
    url: new URL('satellite', config.baseUrl).href,
  })

export default async function SatellitePage() {
  const path = 'satellite'

  const existingImages = await retrieveLatestImagesFromStorage(path)

  const satelliteData = constructChartData(existingImages, path, {
    height: 210,
    width: 280,
  })

  return (
    <RadarAndSatelliteImages
      images={satelliteData}
      chartType="Satellite"
      headerText="Satellite Imagery for New Zealand"
    />
  )
}
