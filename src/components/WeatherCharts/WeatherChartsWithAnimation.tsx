'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { useAtomValue } from 'jotai'
import React from 'react'

import { AdCard } from '@/components/AdCard'
import { AnimatedWeatherChart } from '@/components/AnimatedWeatherChart/animated-weather-chart'
import { showAdsAtom } from '@/components/Atoms/AdState'
import { displayAnimatedChartAtom } from '@/components/Atoms/GlobalState'
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
  const displayAnimatedChart = useAtomValue(displayAnimatedChartAtom)
  const showAds = useAtomValue(showAdsAtom)
  return (
    <>
      <div className="relative flex h-full flex-1 flex-col gap-2">
        {/* AnimatePresence handles the transition between the two views */}
        <AnimatePresence mode="wait">
          {displayAnimatedChart ? (
            <motion.div
              key="animated-view" // Unique key is crucial for AnimatePresence
              variants={viewSwitchVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mx-auto flex w-full max-w-2xl flex-grow flex-col items-center justify-center"
            >
              <AnimatedWeatherChart
                region={props.region}
                charts={props.charts}
              />
            </motion.div>
          ) : (
            <ul
              key="static-list"
              className="mx-auto flex w-full max-w-2xl flex-col items-center px-2 pt-2"
            >
              {props.charts.map((chart, index) => (
                <React.Fragment key={chart.forecastDate}>
                  {showAds && index === AD_POSITION && (
                    <li key="ad-card" className="w-full">
                      <AdCard />
                    </li>
                  )}
                  <li className="w-full">
                    <WeatherChart
                      chart={chart}
                      region={props.region}
                      index={index}
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
