'use client'
import { AnimatePresence, motion } from 'framer-motion' // Import framer-motion
import { useAtom } from 'jotai/index'
import { ChangeEvent, useCallback, useMemo } from 'react'

import {
  animatedChartIndexAtom,
  displayAnimatedChartAtom,
  playAnimationAtom,
} from '@/components/Atoms/GlobalState'
import { SkinnyChartData } from '@/shared/helpers/v2/chartData/constructChartData'

// Icon components (PlayIcon, CrossIcon, PauseIcon) remain the same
function PlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="lg-size-5 size-5"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M8 5v14l11-7z"></path>
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="lg-size-5 size-5"
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
  )
}
function PauseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="lg-size-5 size-5"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
    </svg>
  )
}

function FooterControl({ charts }: { charts: SkinnyChartData[] }) {
  const [playAnimation, setPlayAnimation] = useAtom(playAnimationAtom)
  const [displayAnimatedChart, setDisplayAnimatedChart] = useAtom(
    displayAnimatedChartAtom,
  )
  const [animatedChartIndex, setAnimatedChartIndex] = useAtom(
    animatedChartIndexAtom,
  )

  const handleMasterPlay = useCallback(() => {
    if (displayAnimatedChart) {
      setPlayAnimation(false)
      setAnimatedChartIndex(0)
    } else {
      setPlayAnimation(true)
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

  return (
    <footer className="m:p-2 sticky bottom-0 z-20 border-t border-gray-300 bg-gray-100 px-5 pt-3 pb-6 shadow-lg lg:p-3 dark:border-slate-700 dark:bg-slate-800">
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

        <AnimatePresence>
          {displayAnimatedChart && (
            <motion.div
              key="additional-controls"
              className="flex w-2/3 flex-row items-center space-x-4 lg:gap-5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              // Define a specific, quick transition for when the controls exit
              exit={{
                opacity: 0,
                x: -20,
                transition: { duration: 0.2 }, // Adjust duration as needed for exit
              }}
              // This transition applies to the "enter" animation (initial to animate)
              transition={{
                delay: 0.5, // Wait for the master button's 0.5s animation
                duration: 0.3, // Duration for these controls to fade/slide in
              }}
            >
              <button
                onClick={() => setPlayAnimation((prev) => !prev)}
                className="transform rounded-full bg-slate-700 p-3 text-sky-400 shadow-lg transition-all hover:scale-110 hover:bg-slate-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none lg:p-4"
                aria-label={
                  playAnimation ? 'Pause animation' : 'Play animation'
                }
              >
                {playAnimation ? <PauseIcon /> : <PlayIcon />}
              </button>
              <input
                type="range"
                min="0"
                max={max}
                value={animatedChartIndex}
                onChange={handleProgressChange}
                aria-label="progress bar"
                className="w-full text-sky-400"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </footer>
  )
}
export { FooterControl }
