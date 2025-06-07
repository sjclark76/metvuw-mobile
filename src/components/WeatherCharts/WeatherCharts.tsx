'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { atom, useSetAtom } from 'jotai'
import { useCallback, useState } from 'react'

import { AnimatedWeatherChart } from '@/components/AnimatedWeatherChart/animated-weather-chart'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

import { WeatherChart } from './WeatherChart'

interface WeatherChartsProps {
  region: Region
  charts: SkinnyRainChartData[]
}

export const isWeatherChartAnimatedAtom = atom(false)

// Variants for the container of the static chart list to orchestrate staggered animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Each child will animate 0.1s after the previous one
    },
  },
}

// Variants for each individual static chart item
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      ease: 'easeOut',
      duration: 0.5,
    },
  },
}

// Variants for the fade transition when switching between static and animated views
const viewSwitchVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
}

const WeatherChartsWithAnimation = (props: WeatherChartsProps) => {
  const [displayVideo, setDisplayVideo] = useState(false)
  const setIsWeatherChartAnimated = useSetAtom(isWeatherChartAnimatedAtom)

  const handleMasterPlay = useCallback(() => {
    // This logic correctly toggles the animation state for the child component
    setIsWeatherChartAnimated((prev) => !prev)
    setDisplayVideo((prevState) => !prevState)
  }, [setIsWeatherChartAnimated])

  return (
    <>
      <div className="relative flex h-full flex-1 flex-col items-center justify-center gap-2 pt-2">
        {/* AnimatePresence handles the transition between the two views */}
        <AnimatePresence mode="wait">
          {displayVideo ? (
            <motion.div
              key="animated-view" // Unique key is crucial for AnimatePresence
              variants={viewSwitchVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex h-full w-full flex-col items-center"
            >
              <AnimatedWeatherChart
                region={props.region}
                charts={props.charts}
              />
            </motion.div>
          ) : (
            <motion.ul
              key="static-list" // Unique key
              className="flex flex-col items-center"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {props.charts.map((chart, index) => (
                // Each list item has its own animation variant
                <motion.li
                  key={chart.forecastDate}
                  variants={itemVariants}
                  className="w-full"
                >
                  <WeatherChart
                    chart={chart}
                    region={props.region}
                    index={index}
                  />
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        <button
          onClick={handleMasterPlay}
          className="fixed bottom-4 left-4 z-20 transform rounded-full bg-purple-600 p-4 text-white shadow-lg transition-all hover:scale-110 hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none"
          aria-label={
            displayVideo
              ? 'Show static weather chart list'
              : 'Show animated weather chart'
          }
        >
          {displayVideo ? (
            // X Icon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            // Play Icon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z"></path>
            </svg>
          )}
        </button>
      </div>
    </>
  )
}

export default WeatherChartsWithAnimation
