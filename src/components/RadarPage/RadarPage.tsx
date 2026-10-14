import { ImageProgressProvider } from '@/components/ImageProgress/ImageProgress'
import SubHeader from '@/components/SubHeader'
import { expectedLoadedImages } from '@/shared/helpers/imageLoading'
import { SkinnyChartData } from '@/shared/types/chartData'
import { RadarCode, radarRegions } from '@/shared/types/radarRegions'

import RadarAndSatelliteImages from '../RadarAndSatelliteImages/RadarAndSatelliteImages'

export function RadarPage({
  radarData,
  radarCode,
}: {
  radarData: SkinnyChartData[]
  radarCode: RadarCode
}) {
  return (
    <ImageProgressProvider expected={expectedLoadedImages(radarData.length)}>
      <SubHeader submenuText={`Radar Chart for ${radarRegions[radarCode]}`} />
      <RadarAndSatelliteImages images={radarData} chartType="Radar" />
    </ImageProgressProvider>
  )
}
