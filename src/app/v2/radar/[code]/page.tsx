import { downloadRadarChartData } from '@shared/helpers/s3Helper'
import { isRadarCode } from '@shared/radarRegions'
import { notFound } from 'next/navigation'
import RadarAndSatelliteImages from '@/components/RadarAndSatelliteImages'

export default async function RadarPage({
  params,
}: {
  params: { code: string }
}) {
  const allRadarData = await downloadRadarChartData()

  if (!isRadarCode(params.code)) {
    return notFound()
  }
  const filteredRadarData = allRadarData.filter(
    (radarImage) => radarImage.radarCode === params.code,
  )
  return (
    <RadarAndSatelliteImages images={filteredRadarData} chartType="Radar" />
  )
}
