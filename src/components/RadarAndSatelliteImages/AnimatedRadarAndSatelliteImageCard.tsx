import { useAtom, useAtomValue } from 'jotai/index'
import { useEffect } from 'react'

import {
  animatedChartIndexAtom,
  playAnimationAtom,
} from '@/components/Atoms/GlobalState'
import { RadarAndSatelliteImageCard } from '@/components/RadarAndSatelliteImages/RadarAndSatelliteImageCard'
import { SkinnyChartData } from '@/shared/helpers/v2/chartData/constructChartData'
import { ChartType } from '@/shared/types/ChartType'

type Props = {
  images: SkinnyChartData[]
  chartType: Extract<ChartType, 'Radar' | 'Satellite' | 'Upper Air'>
}

function AnimatedRadarAndSatelliteImageCard({ images, chartType }: Props) {
  const [currentIndex, setCurrentIndex] = useAtom(animatedChartIndexAtom)
  const playAnimation = useAtomValue(playAnimationAtom)

  useEffect(() => {
    let interval
    if (playAnimation) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [playAnimation, images.length, setCurrentIndex])

  return (
    <div>
      <RadarAndSatelliteImageCard
        image={images[currentIndex]}
        chartType={chartType}
        isLazy={true}
      />
    </div>
  )
}

export { AnimatedRadarAndSatelliteImageCard }
