import { useAtom, useAtomValue } from 'jotai'
import { useEffect } from 'react'

import {
  animatedChartIndexAtom,
  playAnimationAtom,
} from '@/components/Atoms/GlobalState'
import { usePreloadedImages } from '@/components/Hooks/usePreloadedImages'
import { RadarAndSatelliteImageCard } from '@/components/RadarAndSatelliteImages/RadarAndSatelliteImageCard'
import { SkinnyChartData } from '@/shared/types/chartData'
import { ChartType } from '@/shared/types/ChartType'

type Props = {
  images: SkinnyChartData[]
  chartType: Extract<ChartType, 'Radar' | 'Satellite' | 'Upper Air'>
}

function AnimatedRadarAndSatelliteImageCard({ images, chartType }: Props) {
  const [currentIndex, setCurrentIndex] = useAtom(animatedChartIndexAtom)
  const playAnimation = useAtomValue(playAnimationAtom)
  // The viewer swaps one image's src, so warm the cache for the whole loop.
  usePreloadedImages(images)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined
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
        isHighPriority={true}
      />
    </div>
  )
}

export { AnimatedRadarAndSatelliteImageCard }
