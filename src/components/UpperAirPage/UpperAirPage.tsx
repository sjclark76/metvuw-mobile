import SubHeader from '@/components/SubHeader'
import {
  BalloonLocationCode,
  balloonLocations,
} from '@/shared/types/balloonLocations'
import { SkinnyChartData } from '@/shared/types/chartData'

import RadarAndSatelliteImages from '../RadarAndSatelliteImages/RadarAndSatelliteImages'

export function UpperAirPage({
  chartData,
  balloonCode,
}: {
  chartData: SkinnyChartData[]
  balloonCode: BalloonLocationCode
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
