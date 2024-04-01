import RadarAndSatelliteImages from '@/components/RadarAndSatelliteImages'
import SubHeader from '@/components/SubHeader'
import { SkinnyChartData } from '@/shared/helpers/v2/chartData/constructChartData'
import { balloonLocations } from '@/shared/types/balloonLocations'

export function UpperAirPage({
  chartData,
  balloonCode,
}: {
  chartData: SkinnyChartData[]
  balloonCode: string
}) {
  return (
    <>
      <SubHeader />
      <RadarAndSatelliteImages
        images={chartData}
        chartType="Upper Air"
        headerText={`Upper Air Chart for ${balloonLocations[balloonCode]}`}
      />
    </>
  )
}
