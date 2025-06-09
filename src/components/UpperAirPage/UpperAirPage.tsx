import { usePreloadedImages } from '@/components/Hooks/usePreloadedImages'
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
  usePreloadedImages(chartData)
  return (
    <>
      <SubHeader
        submenuText={`Upper Air Chart for ${balloonLocations[balloonCode]}`}
      />
      <RadarAndSatelliteImages images={chartData} chartType="Upper Air" />
    </>
  )
}
