'use client'
import clsx from 'clsx'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { ChangeEvent } from 'react'

import { useAnimation } from '@/components/Animation/Animation'
import { BackwardIcon } from '@/components/icons/BackwardIcon'
import { CrossIcon } from '@/components/icons/CrossIcon'
import { ForwardIcon } from '@/components/icons/ForwardIcon'
import { PauseIcon } from '@/components/icons/PauseIcon'
import { PlayIcon } from '@/components/icons/PlayIcon'

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

function FooterControl() {
  const {
    displayAnimated: displayAnimatedChart,
    playing: playAnimation,
    index: animatedChartIndex,
    max,
    toggleDisplay,
    togglePlaying,
    stepBackward,
    stepForward,
    seek,
  } = useAnimation()

  const handleProgressChange = (e: ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value))
  }

  // The installed app pads the footer for the phone's home indicator. `standalone:`
  // is a CSS media query, so it applies from the first paint; a hook that read
  // matchMedia after mount made the footer jump on every load.
  const footerClasses =
    'sticky bottom-0 z-20 border-t border-rule bg-plate p-2 standalone:px-5 standalone:pt-3 standalone:pb-6 lg:p-3 lg:standalone:p-3 print:hidden'

  return (
    <footer className={footerClasses}>
      <AnimatePresence>
        <div
          className={clsx(
            'container mx-auto flex flex-row items-center justify-start',
            displayAnimatedChart && 'space-x-4 lg:gap-5',
          )}
        >
          {/* Slides from the centre to the left edge when the controls open: a
              CSS offset moves it, as justify-content cannot be transitioned. */}
          <button
            onClick={toggleDisplay}
            className={clsx(
              'bg-ink text-paper hover:bg-ink-soft focus:ring-cold relative rounded-full p-3 shadow-lg transition-[left,translate] duration-500 ease-in-out hover:scale-110 focus:ring-2 focus:ring-offset-2 focus:outline-none motion-reduce:transition-none lg:p-4',
              displayAnimatedChart
                ? 'left-0 translate-x-0'
                : 'left-1/2 -translate-x-1/2',
            )}
            aria-label={
              displayAnimatedChart
                ? 'Show static weather chart list'
                : 'Show animated weather chart'
            }
          >
            {displayAnimatedChart ? <CrossIcon /> : <PlayIcon />}
          </button>

          {displayAnimatedChart && (
            <>
              <m.button
                {...motionProps}
                onClick={togglePlaying}
                className="bg-ink text-paper hover:bg-ink-soft focus:ring-cold transform rounded-full p-3 shadow-lg transition-all hover:scale-110 focus:ring-2 focus:ring-offset-2 focus:outline-none lg:p-4"
                aria-label={
                  playAnimation ? 'Pause animation' : 'Play animation'
                }
              >
                {playAnimation ? <PauseIcon /> : <PlayIcon />}
              </m.button>
              <m.input
                {...motionProps}
                type="range"
                min="0"
                max={max}
                value={animatedChartIndex}
                onChange={handleProgressChange}
                aria-label="Chart position"
                aria-valuetext={`Chart ${animatedChartIndex + 1} of ${max + 1}`}
                className="text-ink accent-ink w-full"
              />
              <m.button
                {...motionProps}
                onClick={stepBackward}
                className="bg-ink text-paper hover:bg-ink-soft focus:ring-cold transform rounded-full p-3 shadow-lg transition-all hover:scale-110 focus:ring-2 focus:ring-offset-2 focus:outline-none lg:p-4"
                aria-label="Step backward"
              >
                <BackwardIcon />
              </m.button>
              <m.button
                {...motionProps}
                onClick={stepForward}
                className="bg-ink text-paper hover:bg-ink-soft focus:ring-cold transform rounded-full p-3 shadow-lg transition-all hover:scale-110 focus:ring-2 focus:ring-offset-2 focus:outline-none lg:p-4"
                aria-label="Step forward"
              >
                <ForwardIcon />
              </m.button>
            </>
          )}
        </div>
      </AnimatePresence>
    </footer>
  )
}
export { FooterControl }
