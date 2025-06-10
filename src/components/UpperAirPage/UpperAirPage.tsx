import SubHeader from '@/components/SubHeader'
import { SkinnyChartData } from '@/shared/helpers/v2/chartData/constructChartData'
import { balloonLocations } from '@/shared/types/balloonLocations'
import RadarAndSatelliteImages from '../RadarAndSatelliteImages/RadarAndSatelliteImages'

export function UpperAirPage({
  chartData,
  balloonCode,
}: {
  chartData: SkinnyChartData[]
  balloonCode: string
}) {
  return (
    <>
      <SubHeader
        submenuText={`Upper Air Chart for ${balloonLocations[balloonCode]}`}
      />
      <RadarAndSatelliteImages images={chartData} chartType="Upper Air" />
    </>
  )
}
