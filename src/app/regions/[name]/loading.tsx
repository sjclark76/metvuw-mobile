import SubHeader from '@/components/SubHeader'
import { WeatherChartSkeleton } from '@/components/WeatherCharts/Skeleton'
import { rainImageDimensions } from '@/shared/helpers/v2/imageCompression/imageDimensions'

export default function Loading() {
  return (
    <>
      <SubHeader submenuText="Loading forecast data" />
      <ul className="flex flex-col items-center">
        {/*<WeatherChartSkeleton*/}
        {/*  width={rainImageDimensions.width}*/}
        {/*  height={rainImageDimensions.height}*/}
        {/*/>*/}
        {/*<WeatherChartSkeleton*/}
        {/*  width={rainImageDimensions.width}*/}
        {/*  height={rainImageDimensions.height}*/}
        {/*/>*/}
        {/*<WeatherChartSkeleton*/}
        {/*  width={rainImageDimensions.width}*/}
        {/*  height={rainImageDimensions.height}*/}
        {/*/>*/}
      </ul>
    </>
  )
}
