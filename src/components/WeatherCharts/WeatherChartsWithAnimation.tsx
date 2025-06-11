'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { useAtomValue } from 'jotai'

import { AnimatedWeatherChart } from '@/components/AnimatedWeatherChart/animated-weather-chart'
import { displayAnimatedChartAtom } from '@/components/Atoms/GlobalState'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

import { WeatherChart } from './WeatherChart'

interface WeatherChartsProps {
  region: Region
  charts: SkinnyRainChartData[]
}

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
  const displayAnimatedChart = useAtomValue(displayAnimatedChartAtom)
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
              <AnimatedWeatherChart
                region={props.region}
                charts={props.charts}
              />
            </motion.div>
          ) : (
            <motion.ul
              key="static-list" // Unique key
              className="mx-auto flex w-full max-w-2xl flex-col items-center px-2"
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
      </div>
    </>
  )
}

export default WeatherChartsWithAnimation
