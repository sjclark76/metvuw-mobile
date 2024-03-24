// import { WeatherChartSkeleton } from '@/components/WeatherCharts/Skeleton'

import { WeatherChartSkeleton } from '@/components/WeatherCharts/Skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col items-center">
      <WeatherChartSkeleton />
      <WeatherChartSkeleton />
      <WeatherChartSkeleton />
    </div>
  )
}
