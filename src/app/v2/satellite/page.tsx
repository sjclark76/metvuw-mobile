import { downloadSatelliteChartData } from '@shared/helpers/s3Helper'
import RadarAndSatelliteImages from '@/components/RadarAndSatelliteImages'

export default async function SatellitePage() {
  const satelliteData = await downloadSatelliteChartData()

  return (
    <RadarAndSatelliteImages images={satelliteData} chartType={'Satellite'} />
  )
}
