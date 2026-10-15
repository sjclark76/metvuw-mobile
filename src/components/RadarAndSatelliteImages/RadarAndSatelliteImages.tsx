'use client'
import { useAtomValue } from 'jotai'
import { AnimatePresence, motion } from 'motion/react'
import React from 'react'

import { AdCard } from '@/components/AdCard'
import { useAnimation } from '@/components/Animation/Animation'
import { showAdsAtom, useInitShowAds } from '@/components/Atoms/AdState'
import { AnimatedRadarAndSatelliteImageCard } from '@/components/RadarAndSatelliteImages/AnimatedRadarAndSatelliteImageCard'
import { RadarAndSatelliteImageCard } from '@/components/RadarAndSatelliteImages/RadarAndSatelliteImageCard'
import { fadeInProps } from '@/shared/helpers/fadeIn'
import { imageLoadingFor } from '@/shared/helpers/imageLoading'
import { SkinnyChartData } from '@/shared/types/chartData'
import { ChartType } from '@/shared/types/ChartType'

interface Props {
  images: SkinnyChartData[]
  chartType: Extract<ChartType, 'Radar' | 'Satellite' | 'Upper Air'>
}

// Variants for the fade transition when switching between static and animated views
const viewSwitchVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
}

const AD_POSITION = 2

export default function Foo({ images, chartType }: Props) {
  const { displayAnimated: displayAnimatedChart } = useAnimation()
  const showAds = useAtomValue(showAdsAtom)
  useInitShowAds()

  return (
    <>
      <div className="relative flex h-full flex-1 flex-col items-center justify-center gap-2 pt-2">
        {/* AnimatePresence handles the transition between the two views */}
        <AnimatePresence mode="wait">
          {displayAnimatedChart ? (
            <motion.div
              key="animated-view" // Unique key is crucial for AnimatePresence
              variants={viewSwitchVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex h-full w-full flex-col items-center"
            >
              <AnimatedRadarAndSatelliteImageCard
                images={images}
                chartType={chartType}
              />
            </motion.div>
          ) : (
            <ul
              key="static-list"
              className="mx-auto flex w-full max-w-2xl flex-col items-center px-2"
            >
              {images.map((image, index) => (
                <React.Fragment key={image.url}>
                  {showAds && index === AD_POSITION && (
                    <li key="ad-card" className="w-full">
                      <AdCard />
                    </li>
                  )}
                  <li {...fadeInProps(index, 'w-full')}>
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
        </AnimatePresence>
      </div>
    </>
  )
}
