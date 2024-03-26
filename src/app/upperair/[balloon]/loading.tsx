import { WeatherChartSkeleton } from '@/components/WeatherCharts/Skeleton'

export default function Loading() {
  return (
    <ul className="flex flex-col items-center">
      <WeatherChartSkeleton />
      <WeatherChartSkeleton />
      <WeatherChartSkeleton />
    </ul>
  )
}
