import { Metadata } from 'next'

import RadarAndSatelliteImages from '@/components/RadarAndSatelliteImages'
import { config } from '@/config'
import generateSEOMetadata from '@/shared/helpers/generateSEOMetadata'
import { downloadSatelliteChartData } from '@/shared/helpers/s3Helper'

export const generateMetadata = async (): Promise<Metadata> =>
  generateSEOMetadata({
    description: `Satellite wind & rain forecast charts. Optimized for mobile devices. Sourced from metvuw.com`,
    title: `metvuw mobile | Satellite`,
    url: new URL('satellite', config.baseUrl).href,
  })

export default async function SatellitePage() {
  const satelliteData = await downloadSatelliteChartData()
  return (
    <RadarAndSatelliteImages images={satelliteData} chartType="Satellite" />
  )
}
