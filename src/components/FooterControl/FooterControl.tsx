'use client'
import clsx from 'clsx'
import { ReactNode, useEffect, useRef } from 'react'

import { useAnimation } from '@/components/Animation/Animation'

import {
  CloseIcon,
  OpenViewerIcon,
  PauseIcon,
  PlayIcon,
  StepBackIcon,
  StepForwardIcon,
} from './icons'
import { TimeAxis } from './TimeAxis'
import { useChartScrollSync } from './useChartScrollSync'

const control =
  'grid shrink-0 place-items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cold'
const solid = `${control} size-12 rounded-full bg-ink text-paper hover:bg-ink-soft`
const quiet = `${control} size-11 rounded text-ink hover:bg-rule`

function Control({
  label,
  onClick,
  className,
  children,
}: {
  label: string
  onClick: () => void
  className: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  )
}

function FooterControl() {
  const {
    displayAnimated,
    playing,
    index,
    max,
    times,
    toggleDisplay,
    togglePlaying,
    stepBackward,
    stepForward,
    seek,
  } = useAnimation()

  // In the list, the axis follows the chart in view and moves the list when it
  // is dragged. In the viewer the axis simply changes the chart shown.
  const { scrollToChart } = useChartScrollSync({
    enabled: !displayAnimated,
    index,
    onIndex: seek,
  })
  const onSeek = (target: number) => {
    seek(target)
    if (!displayAnimated) scrollToChart(target)
  }

  // Things that stick above the footer (the rainfall legend) need to know how
  // tall it is, and it is taller in the viewer, where the axis has its own row.
  const footerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const footer = footerRef.current
    if (!footer || typeof ResizeObserver === 'undefined') return
    const publish = () =>
      document.documentElement.style.setProperty(
        '--footer-height',
        `${footer.offsetHeight}px`,
      )
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(footer)
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty('--footer-height')
    }
  }, [])

  // The installed app pads the footer for the phone's home indicator. `standalone:`
  // is a CSS media query, so it applies from the first paint; a hook that read
  // matchMedia after mount made the footer jump on every load.
  const footerClasses =
    'sticky bottom-0 z-20 border-t border-rule bg-plate px-4 pt-2.5 pb-2.5 standalone:pb-6 print:hidden'

  return (
    <footer ref={footerRef} className={footerClasses}>
      <div
        className={clsx(
          'mx-auto flex max-w-176 items-center gap-3',
          // The viewer has four controls, so the axis gets a full-width row of
          // its own above them instead of being squeezed beside them.
          displayAnimated && 'flex-col-reverse items-stretch gap-1',
        )}
      >
        <div
          className={clsx(
            'flex items-center gap-1',
            displayAnimated && 'justify-center gap-3',
          )}
        >
          <Control
            label={
              displayAnimated
                ? 'Show static weather chart list'
                : 'Show animated weather chart'
            }
            onClick={toggleDisplay}
            className={solid}
          >
            {displayAnimated ? <CloseIcon /> : <OpenViewerIcon />}
          </Control>

          {displayAnimated && (
            <>
              <Control
                label={playing ? 'Pause animation' : 'Play animation'}
                onClick={togglePlaying}
                className={quiet}
              >
                {playing ? <PauseIcon /> : <PlayIcon />}
              </Control>
              <Control
                label="Step backward"
                onClick={stepBackward}
                className={quiet}
              >
                <StepBackIcon />
              </Control>
              <Control
                label="Step forward"
                onClick={stepForward}
                className={quiet}
              >
                <StepForwardIcon />
              </Control>
            </>
          )}
        </div>

        <TimeAxis times={times} index={index} max={max} onSeek={onSeek} />
      </div>
    </footer>
  )
}
export { FooterControl }
