import SubHeader from '@/components/SubHeader'
import { WeatherChartSkeleton } from '@/components/WeatherCharts/Skeleton'
import { upperAirImageDimensions } from '@/shared/helpers/v2/imageCompression/imageDimensions'

export default function Loading() {
  return (
    <>
      <SubHeader submenuText="Loading upper air data" />
      <ul className="flex flex-col items-center">
        <WeatherChartSkeleton
          width={upperAirImageDimensions.width}
          height={upperAirImageDimensions.height}
        />
        <WeatherChartSkeleton
          width={upperAirImageDimensions.width}
          height={upperAirImageDimensions.height}
        />
        <WeatherChartSkeleton
          width={upperAirImageDimensions.width}
          height={upperAirImageDimensions.height}
        />
      </ul>
    </>
  )
}
