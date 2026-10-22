'use client'
import clsx from 'clsx'
import { useAtomValue } from 'jotai'
import { ReactNode, useEffect, useRef } from 'react'

import { useTrackOnce } from '@/components/Analytics/useTrackOnce'
import { useAnimation } from '@/components/Animation/Animation'
import { showSliderAtom, showViewerAtom } from '@/components/Atoms/GlobalState'
import { usePins } from '@/components/Pins/usePins'
import { RainStrip } from '@/components/RainStrip/RainStrip'
import { useChartsSettled } from '@/components/RainStrip/useChartsSettled'
import { useRainReadings } from '@/components/RainStrip/useRainReadings'
import { track } from '@/shared/helpers/analytics/track'
import type { RegionCode } from '@/shared/types/region'

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

function FooterControl({
  rain,
}: {
  /** The region's rain charts, for the strip that shows rain at the visitor's pins. */
  rain?: { region: RegionCode; chartUrls: readonly string[] }
}) {
  const {
    displayAnimated,
    playing,
    index,
    max,
    times,
    intervalMs,
    toggleDisplay,
    togglePlaying,
    stepBackward,
    stepForward,
    seek,
  } = useAnimation()

  const { pins } = usePins()
  const showViewer = useAtomValue(showViewerAtom)
  const showSlider = useAtomValue(showSliderAtom)
  const chartsSettled = useChartsSettled()
  const readings = useRainReadings({
    region: rain?.region ?? 'nz',
    chartUrls: rain ? rain.chartUrls : [],
    current: index,
    // Nothing is read for a strip that is hidden.
    pins: rain && showSlider ? pins : [],
    ready: chartsSettled,
  })

  // A viewer that is open when it is turned off in Settings closes.
  useEffect(() => {
    if (!showViewer && displayAnimated) toggleDisplay()
  }, [showViewer, displayAnimated, toggleDisplay])

  // In the list, the axis follows the chart in view and moves the list when it
  // is dragged. In the viewer the axis simply changes the chart shown.
  const { scrollToChart } = useChartScrollSync({
    enabled: !displayAnimated,
    index,
    onIndex: seek,
  })
  const seekTo = (target: number) => {
    seek(target)
    if (!displayAnimated) scrollToChart(target)
  }
  // Dragging the slider asks for a chart many times a second: once per page says
  // it is used.
  const trackOnce = useTrackOnce()
  const onSlide = (target: number) => {
    trackOnce('slider_used')
    seekTo(target)
  }

  // Things that stick above the footer (the rainfall legend) need to know how
  // tall it is, and it is taller in the viewer, where the axis has its own row.
  const footerRef = useRef<HTMLElement>(null)
  const gapRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const footer = footerRef.current
    const gap = gapRef.current
    if (!footer || !gap || typeof ResizeObserver === 'undefined') return
    // The footer is fixed, so it takes no room: a gap as tall as it is keeps the
    // end of the page clear of it. Written straight to the element, not through
    // React state, so it is right before the frame is drawn.
    const publish = () => {
      gap.style.height = `${footer.offsetHeight}px`
      document.documentElement.style.setProperty(
        '--footer-height',
        `${footer.offsetHeight}px`,
      )
    }
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(footer)
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty('--footer-height')
    }
  }, [])

  // Fixed, not sticky, for the same reason as the bar across the top: on an
  // iPhone a sticky bar is put in place a frame behind a large scroll, so jumping
  // the page by dragging the time axis made it flash. A fixed bar is placed with
  // the page's own layer.
  //
  // The installed app pads the footer for the phone's home indicator. `standalone:`
  // is a CSS media query, so it applies from the first paint; a hook that read
  // matchMedia after mount made the footer jump on every load.
  const footerClasses =
    'fixed inset-x-0 bottom-0 lg:left-64 z-20 border-t border-rule bg-plate px-4 pt-2.5 pb-2.5 standalone:pb-6 print:hidden'

  return (
    <>
      <footer ref={footerRef} data-footer className={footerClasses}>
        <div
          className={clsx(
            'mx-auto flex max-w-176 items-center gap-3',
            // The viewer has four controls, so the axis gets a full-width row of
            // its own above them instead of being squeezed beside them.
            displayAnimated && 'flex-col-reverse items-stretch gap-1',
          )}
        >
          <div
            data-footer-viewer
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
              onClick={() => {
                if (!displayAnimated) track('viewer_opened')
                toggleDisplay()
              }}
              className={solid}
            >
              {displayAnimated ? <CloseIcon /> : <OpenViewerIcon />}
            </Control>

            {displayAnimated && (
              <>
                <Control
                  label={playing ? 'Pause animation' : 'Play animation'}
                  onClick={() => {
                    if (!playing) track('viewer_played')
                    togglePlaying()
                  }}
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

          <TimeAxis
            times={times}
            index={index}
            max={max}
            onSeek={onSlide}
            glideMs={displayAnimated && playing ? intervalMs : undefined}
            above={
              rain && pins.length > 0
                ? (axis) => (
                    <RainStrip
                      region={rain.region}
                      pins={pins}
                      chartUrls={rain.chartUrls}
                      times={times}
                      index={index}
                      readings={readings}
                      onSeek={seekTo}
                      axis={axis}
                    />
                  )
                : undefined
            }
          />
        </div>
      </footer>
      {/* Until the footer is measured, the height it has without a strip. */}
      <div
        ref={gapRef}
        aria-hidden="true"
        data-footer-gap
        className="standalone:h-23 h-19 print:hidden pointer-coarse:h-22"
      />
    </>
  )
}
export { FooterControl }
