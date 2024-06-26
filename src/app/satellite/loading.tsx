// import { WeatherChartSkeleton } from '@/components/WeatherCharts/Skeleton'

import SubHeader from '@/components/SubHeader'
import { WeatherChartSkeleton } from '@/components/WeatherCharts/Skeleton'
import { satelliteImageDimensions } from '@/shared/helpers/v2/imageCompression/imageDimensions'

export default function Loading() {
  return (
    <>
      <SubHeader submenuText="Loading satellite data" />
      <ul className="flex flex-col items-center">
        <WeatherChartSkeleton
          width={satelliteImageDimensions.width}
          height={satelliteImageDimensions.height}
        />
        <WeatherChartSkeleton
          width={satelliteImageDimensions.width}
          height={satelliteImageDimensions.height}
        />
        <WeatherChartSkeleton
          width={satelliteImageDimensions.width}
          height={satelliteImageDimensions.height}
        />
      </ul>
    </>
  )
}
