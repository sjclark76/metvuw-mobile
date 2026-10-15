import { useAnimation } from '@/components/Animation/Animation'
import { usePreloadedImages } from '@/components/Hooks/usePreloadedImages'
import { RadarAndSatelliteImageCard } from '@/components/RadarAndSatelliteImages/RadarAndSatelliteImageCard'
import { SkinnyChartData } from '@/shared/types/chartData'
import { ChartType } from '@/shared/types/ChartType'

type Props = {
  images: SkinnyChartData[]
  chartType: Extract<ChartType, 'Radar' | 'Satellite' | 'Upper Air'>
}

function AnimatedRadarAndSatelliteImageCard({ images, chartType }: Props) {
  // The animation provider owns the timer and keeps the index within the images.
  const { index } = useAnimation()
  // The viewer swaps one image's src, so warm the cache for the whole loop.
  usePreloadedImages(images)

  return (
    <div>
      <RadarAndSatelliteImageCard
        image={images[index]}
        chartType={chartType}
        isHighPriority={true}
      />
    </div>
  )
}

export { AnimatedRadarAndSatelliteImageCard }
