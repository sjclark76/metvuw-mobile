import SubHeader from '@/components/SubHeader'
import { balloonLocations } from '@/shared/types/balloonLocations'
import { SkinnyChartData } from '@/shared/types/chartData'

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
