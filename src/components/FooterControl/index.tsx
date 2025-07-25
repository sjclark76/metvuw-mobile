'use client'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion' // Import framer-motion
import { useAtom } from 'jotai/index'
import { ChangeEvent, useCallback, useMemo } from 'react'

import {
  animatedChartIndexAtom,
  displayAnimatedChartAtom,
  playAnimationAtom,
} from '@/components/Atoms/GlobalState'
import { useIsStandalone } from '@/components/Hooks/useIsStandalone'
import { BackwardIcon } from '@/components/icons/BackwardIcon'
import { CrossIcon } from '@/components/icons/CrossIcon'
import { ForwardIcon } from '@/components/icons/ForwardIcon'
import { PauseIcon } from '@/components/icons/PauseIcon'
import { PlayIcon } from '@/components/icons/PlayIcon'
import { SkinnyChartData } from '@/shared/helpers/v2/chartData/constructChartData'

const motionProps = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  // Define a specific, quick transition for when the controls exit
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2 }, // Adjust duration as needed for exit
  },
  // This transition applies to the "enter" animation (initial to animate)
  transition: {
    delay: 0.5, // Wait for the master button's 0.5s animation
    duration: 0.3, // Duration for these controls to fade/slide in
  },
}

function FooterControl({ charts }: { charts: SkinnyChartData[] }) {
  const [playAnimation, setPlayAnimation] = useAtom(playAnimationAtom)
  const [displayAnimatedChart, setDisplayAnimatedChart] = useAtom(
    displayAnimatedChartAtom,
  )
  const [animatedChartIndex, setAnimatedChartIndex] = useAtom(
    animatedChartIndexAtom,
  )
  const isStandalone = useIsStandalone()

  const handleMasterPlay = useCallback(() => {
    if (displayAnimatedChart) {
      setPlayAnimation(false)
      setAnimatedChartIndex(0)
    } else {
      setPlayAnimation(false)
    }
    setDisplayAnimatedChart((prev) => !prev)
  }, [
    displayAnimatedChart,
    setPlayAnimation,
    setDisplayAnimatedChart,
    setAnimatedChartIndex,
  ])

  const handleProgressChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAnimatedChartIndex(Number(e.target.value))
  }

  const max = useMemo(
    () => (charts && charts.length > 0 ? charts.length - 1 : 0),
    [charts],
  )
  const handleBackward = () => {
    setPlayAnimation(false)
    setAnimatedChartIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleForward = () => {
    setPlayAnimation(false)
    setAnimatedChartIndex((prev) => Math.min(prev + 1, max))
  }

  const footerClasses = clsx(
    'sticky bottom-0 z-20 border-t border-gray-300 bg-gray-100 shadow-lg lg:p-3 dark:border-slate-700 dark:bg-slate-800 print:hidden',
    {
      'm:p-2 px-5 pt-3 pb-6': isStandalone,
      'p-2': !isStandalone,
    },
  )

  return (
    <footer className={footerClasses}>
      <AnimatePresence>
        <div
          className={`container mx-auto flex flex-row items-center ${
            displayAnimatedChart
              ? 'justify-start space-x-4 lg:gap-5'
              : 'justify-center'
          }`}
        >
          <motion.button
            layout // This enables smooth animation when layout changes
            // For more control over the animation, you can add a transition prop:
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.5 }}
            onClick={handleMasterPlay}
            className="transform rounded-full bg-slate-700 p-3 text-sky-400 shadow-lg hover:scale-110 hover:bg-slate-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none lg:p-4"
            aria-label={
              displayAnimatedChart
                ? 'Show static weather chart list'
                : 'Show animated weather chart'
            }
          >
            {displayAnimatedChart ? <CrossIcon /> : <PlayIcon />}
          </motion.button>

          {displayAnimatedChart && (
            <>
              <motion.button
                {...motionProps}
                onClick={() => setPlayAnimation((prev) => !prev)}
                className="transform rounded-full bg-slate-700 p-3 text-sky-400 shadow-lg transition-all hover:scale-110 hover:bg-slate-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none lg:p-4"
                aria-label={
                  playAnimation ? 'Pause animation' : 'Play animation'
                }
              >
                {playAnimation ? <PauseIcon /> : <PlayIcon />}
              </motion.button>
              <motion.input
                {...motionProps}
                type="range"
                min="0"
                max={max}
                value={animatedChartIndex}
                onChange={handleProgressChange}
                aria-label="progress bar"
                className="w-full text-sky-400"
              />
              <motion.button
                {...motionProps}
                onClick={handleBackward}
                className="transform rounded-full bg-slate-700 p-3 text-sky-400 shadow-lg transition-all hover:scale-110 hover:bg-slate-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none lg:p-4"
                aria-label="Step backward"
              >
                <BackwardIcon />
              </motion.button>
              <motion.button
                {...motionProps}
                onClick={handleForward}
                className="transform rounded-full bg-slate-700 p-3 text-sky-400 shadow-lg transition-all hover:scale-110 hover:bg-slate-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none lg:p-4"
                aria-label="Step forward"
              >
                <ForwardIcon />
              </motion.button>
            </>
          )}
        </div>
      </AnimatePresence>
    </footer>
  )
}
export { FooterControl }
