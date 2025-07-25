// import { WeatherChartSkeleton } from '@/components/WeatherCharts/Skeleton'

import SubHeader from '@/components/SubHeader'
import { WeatherChartSkeleton } from '@/components/WeatherCharts/Skeleton'
import { satelliteImageDimensions } from '@/shared/helpers/v2/imageCompression/imageDimensions'

export default function Loading() {
  return (
    <>
      <SubHeader submenuText="Loading satellite data" />
    </>
  )
}
