'use client'
import { useAtom, useAtomValue } from 'jotai'
import { useEffect } from 'react'

import {
  animatedChartIndexAtom,
  playAnimationAtom,
} from '@/components/Atoms/GlobalState'
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
  const [currentIndex, setCurrentIndex] = useAtom(animatedChartIndexAtom)
  const playAnimation = useAtomValue(playAnimationAtom)

  useEffect(() => {
    let interval
    if (playAnimation) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % charts.length)
      }, 250)
    }
    return () => clearInterval(interval)
  }, [playAnimation, charts.length, setCurrentIndex])

  return (
    <WeatherChart
      region={region}
      chart={charts[currentIndex]}
      index={currentIndex}
    />
  )
}
export { AnimatedWeatherChart }
