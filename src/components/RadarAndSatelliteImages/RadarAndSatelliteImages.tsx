'use client'
import { useAtomValue } from 'jotai'
import React from 'react'

import { AdCard } from '@/components/AdCard'
import { useAnimation } from '@/components/Animation/Animation'
import { showAdsAtom, useInitShowAds } from '@/components/Atoms/AdState'
import { usePresence } from '@/components/Hooks/usePresence'
import { AnimatedRadarAndSatelliteImageCard } from '@/components/RadarAndSatelliteImages/AnimatedRadarAndSatelliteImageCard'
import { RadarAndSatelliteImageCard } from '@/components/RadarAndSatelliteImages/RadarAndSatelliteImageCard'
import { fadeInProps } from '@/shared/helpers/fadeIn'
import { chartAspectRatio } from '@/shared/helpers/imageCompression/imageDimensions'
import { imageLoadingFor } from '@/shared/helpers/imageLoading'
import { SkinnyChartData } from '@/shared/types/chartData'
import { ChartType } from '@/shared/types/ChartType'

interface Props {
  images: SkinnyChartData[]
  chartType: Extract<ChartType, 'Radar' | 'Satellite' | 'Upper Air'>
}

// As long as the viewer's fade out (animate-fade-out in globals.css).
const VIEWER_EXIT_MS = 300

const AD_POSITION = 2

export default function Foo({ images, chartType }: Props) {
  const { displayAnimated: displayAnimatedChart } = useAnimation()
  const showAds = useAtomValue(showAdsAtom)
  // The viewer fades in; going back, it fades out before the list comes back.
  const viewer = usePresence(displayAnimatedChart, VIEWER_EXIT_MS)
  useInitShowAds()

  return (
    <>
      <div className="relative flex h-full flex-1 flex-col items-center justify-center gap-2 pt-2">
        {viewer !== 'gone' ? (
          <div
            className={`flex h-full w-full flex-col items-center ${viewer === 'shown' ? 'animate-fade-in' : 'animate-fade-out'}`}
          >
            <AnimatedRadarAndSatelliteImageCard
              images={images}
              chartType={chartType}
            />
          </div>
        ) : (
          <ul
            key="static-list"
            className="mx-auto flex w-full max-w-176 flex-col items-center"
          >
            {images.map((image, index) => (
              <React.Fragment key={image.url}>
                {showAds && index === AD_POSITION && (
                  <li key="ad-card" className="w-full">
                    <AdCard />
                  </li>
                )}
                <li
                  {...fadeInProps(
                    index,
                    'w-full scroll-mt-20',
                    chartAspectRatio(chartType),
                  )}
                  data-chart-index={index}
                >
                  <RadarAndSatelliteImageCard
                    image={image}
                    chartType={chartType}
                    isHighPriority={index == 0}
                    loading={imageLoadingFor(index)}
                  />
                </li>
              </React.Fragment>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
