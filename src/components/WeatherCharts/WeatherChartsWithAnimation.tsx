'use client'
import { useAtomValue } from 'jotai'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import React from 'react'

import { AdCard } from '@/components/AdCard'
import { AnimatedWeatherChart } from '@/components/AnimatedWeatherChart/AnimatedWeatherChart'
import { useAnimation } from '@/components/Animation/Animation'
import { showAdsAtom } from '@/components/Atoms/AdState'
import { fadeInProps } from '@/shared/helpers/fadeIn'
import { chartAspectRatio } from '@/shared/helpers/imageCompression/imageDimensions'
import { imageLoadingFor } from '@/shared/helpers/imageLoading'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

import { WeatherChart } from './WeatherChart'

interface WeatherChartsProps {
  region: Region
  charts: SkinnyRainChartData[]
}

// Variants for the fade transition when switching between static and animated views
const viewSwitchVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
}

const AD_POSITION = 2

const WeatherChartsWithAnimation = (props: WeatherChartsProps) => {
  const { displayAnimated: displayAnimatedChart } = useAnimation()
  const showAds = useAtomValue(showAdsAtom)
  return (
    <>
      <div className="relative flex h-full flex-1 flex-col gap-2">
        {/* AnimatePresence handles the transition between the two views */}
        <AnimatePresence mode="wait">
          {displayAnimatedChart ? (
            <m.div
              key="animated-view" // Unique key is crucial for AnimatePresence
              variants={viewSwitchVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mx-auto flex w-full max-w-176 flex-grow flex-col items-center justify-center"
            >
              <AnimatedWeatherChart
                region={props.region}
                charts={props.charts}
              />
            </m.div>
          ) : (
            <ul
              key="static-list"
              className="mx-auto flex w-full max-w-176 flex-col items-center pt-2"
            >
              {props.charts.map((chart, index) => (
                <React.Fragment key={chart.forecastDate}>
                  {showAds && index === AD_POSITION && (
                    <li key="ad-card" className="w-full">
                      <AdCard />
                    </li>
                  )}
                  <li
                    {...fadeInProps(
                      index,
                      'w-full scroll-mt-20',
                      chartAspectRatio('Rain'),
                    )}
                    data-chart-index={index}
                  >
                    <WeatherChart
                      chart={chart}
                      region={props.region}
                      index={index}
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

export default WeatherChartsWithAnimation
