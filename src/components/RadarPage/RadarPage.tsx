import RadarAndSatelliteImages from '@/components/RadarAndSatelliteImages'
import SubHeader from '@/components/SubHeader'
import { SkinnyChartData } from '@/shared/helpers/v2/chartData/constructChartData'
import { radarRegions } from '@/shared/types/radarRegions'

export function RadarPage({
  radarData,
  radarCode,
}: {
  radarData: SkinnyChartData[]
  radarCode: string
}) {
  return (
    <>
      <SubHeader submenuText={`Radar Chart for ${radarRegions[radarCode]}`} />
      <RadarAndSatelliteImages images={radarData} chartType="Radar" />
    </>
  )
}
