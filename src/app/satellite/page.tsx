import { downloadSatelliteChartData } from '@shared/helpers/s3Helper'
import RadarAndSatelliteImages from '@/components/RadarAndSatelliteImages'
import { Metadata } from 'next'
import generateSEOMetadata from '@shared/helpers/generateSEOMetadata'
import { config } from '@/config'

export const generateMetadata = async (): Promise<Metadata> =>
  generateSEOMetadata({
    title: `metvuw mobile | Satellite`,
    description: `Satellite wind & rain forecast charts. Optimized for mobile devices. Sourced from metvuw.com`,
    url: new URL('satellite', config.baseUrl).href,
  })

export default async function SatellitePage() {
  const satelliteData = await downloadSatelliteChartData()

  return (
    <RadarAndSatelliteImages images={satelliteData} chartType="Satellite" />
  )
}
