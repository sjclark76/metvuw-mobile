/* eslint-disable no-console */
'use client'
import { AnimatePresence, motion, Variants } from 'framer-motion'
import { useAtomValue } from 'jotai/index'

import { displayAnimatedChartAtom } from '@/components/Atoms/GlobalState'
import { AnimatedRadarAndSatelliteImageCard } from '@/components/RadarAndSatelliteImages/AnimatedRadarAndSatelliteImageCard'
import { RadarAndSatelliteImageCard } from '@/components/RadarAndSatelliteImages/RadarAndSatelliteImageCard'
import { SkinnyChartData } from '@/shared/helpers/v2/chartData/constructChartData'
import { ChartType } from '@/shared/types/ChartType'

interface Props {
  images: SkinnyChartData[]
  chartType: Extract<ChartType, 'Radar' | 'Satellite' | 'Upper Air'>
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
const itemVariants: Variants = {
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

export default function Foo({ images, chartType }: Props) {
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
              <AnimatedRadarAndSatelliteImageCard
                images={images}
                chartType={chartType}
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
              {images.map((image, index) => (
                // Each list item has its own animation variant
                <motion.li
                  key={image.url}
                  variants={itemVariants}
                  className="w-full"
                >
                  <RadarAndSatelliteImageCard
                    image={image}
                    chartType={chartType}
                    isLazy={index > 1}
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
