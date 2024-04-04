import { WeatherChartSkeleton } from '@/components/WeatherCharts/Skeleton'
import { radarImageDimensions } from '@/shared/helpers/v2/imageCompression/imageDimensions'

export default function Loading() {
  return (
    <ul className="flex flex-col items-center">
      <WeatherChartSkeleton
        width={radarImageDimensions.width}
        height={radarImageDimensions.height}
      />
      <WeatherChartSkeleton
        width={radarImageDimensions.width}
        height={radarImageDimensions.height}
      />
      <WeatherChartSkeleton
        width={radarImageDimensions.width}
        height={radarImageDimensions.height}
      />
    </ul>
  )
}
