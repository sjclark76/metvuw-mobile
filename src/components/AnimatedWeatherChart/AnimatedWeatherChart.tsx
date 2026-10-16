'use client'
import { useAnimation } from '@/components/Animation/Animation'
import { usePreloadedImages } from '@/components/Hooks/usePreloadedImages'
import { WeatherChart } from '@/components/WeatherCharts/WeatherChart'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

interface AnimatedWeatherChartProps {
  region: Region
  charts: SkinnyRainChartData[]
}
const AnimatedWeatherChart = ({
  region,
  charts,
}: AnimatedWeatherChartProps) => {
  // The animation provider owns the timer and keeps the index within the charts.
  const { index } = useAnimation()
  // The viewer swaps one image's src, so warm the cache for the whole loop.
  usePreloadedImages(charts)

  return <WeatherChart region={region} chart={charts[index]} index={index} />
}
export { AnimatedWeatherChart }
