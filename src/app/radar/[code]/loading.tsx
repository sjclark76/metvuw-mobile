import SubHeader from '@/components/SubHeader'
import { WeatherChartSkeleton } from '@/components/WeatherCharts/Skeleton'
import { radarImageDimensions } from '@/shared/helpers/v2/imageCompression/imageDimensions'

export default function Loading() {
  return (
    <>
      <SubHeader submenuText="Loading radar data" />
    </>
  )
}
