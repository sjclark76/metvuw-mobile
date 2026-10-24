'use client'
import { useAtom } from 'jotai'
import { useEffect, useId } from 'react'

import { useTrackOnce } from '@/components/Analytics/useTrackOnce'
import { rainStripPinAtom } from '@/components/Atoms/GlobalState'
import { useFormatDate } from '@/components/Hooks/useFormatDate'
import { track } from '@/shared/helpers/analytics/track'
import { chartPosition } from '@/shared/helpers/chartGeometry'
import { chartLabel, type Pin } from '@/shared/helpers/pins/pins'
import { RAIN_BANDS } from '@/shared/helpers/rainBands'
import type { RainReading } from '@/shared/helpers/rainStrip/readRain'
import type { RegionCode } from '@/shared/types/region'

import { ALL_PINS, chosenPins, describeRain } from './describeRain'
import type { RainReadings } from './useRainReadings'

// The chart's own background, which is what a clear cell is: nothing to show.
const CLEAR = '#e6e6ff'

// A chart not read yet, or that could not be: striped, so it is not taken for dry.
const UNREAD =
  'repeating-linear-gradient(135deg, transparent 0 3px, rgb(128 128 150 / 0.35) 3px 4px)'

function cellColour(reading: RainReading | undefined) {
  if (!reading) return undefined
  if (reading.kind === 'rain') return RAIN_BANDS[reading.band].hexCode
  return reading.kind === 'clear' ? CLEAR : undefined
}

/**
 * When rain arrives at the visitor's pins, as a row of cells above the time axis,
 * one for each chart, coloured by the band of rain the chart shows at the pin.
 * A selector chooses one pin, or all of them (a row each); the choice is kept.
 * Each row says what the chart in view shows there. Tapping a cell goes to that
 * chart. The cells are for the eye and the finger; the slider is the control for
 * the keyboard, and the words are read out as it moves.
 */
export function RainStrip({
  region,
  pins,
  chartUrls,
  times,
  index,
  readings,
  onSeek,
  axis,
  highlights = {},
}: {
  region: RegionCode
  pins: readonly Pin[]
  chartUrls: readonly string[]
  times: readonly number[]
  index: number
  readings: RainReadings
  onSeek: (index: number) => void
  /** For each pin, the charts where heavy rain is ahead, outlined. */
  highlights?: Readonly<Record<string, { from: number; to: number }>>
  /** Where each chart is on the time axis, so the cells line up with its ticks. */
  axis: {
    percent: (position: number) => string
    pixelsPerChart: number
  }
}) {
  const formatDate = useFormatDate()
  const [choice, setChoice] = useAtom(rainStripPinAtom)
  const selectId = useId()
  const trackOnce = useTrackOnce()
  const showing = pins.length > 0
  useEffect(() => {
    if (showing) trackOnce('rain_strip_shown')
  }, [showing, trackOnce])
  if (pins.length === 0) return null

  const shown = chosenPins(pins, choice)
  const selected = shown.length === 1 ? shown[0].id : ALL_PINS
  const when =
    times[index] === undefined ? '' : formatDate(times[index], 'EEE h:mmaaa')
  const readingAt = (pin: Pin) => {
    if (chartPosition(region, pin.latitude, pin.longitude) === undefined) {
      return { kind: 'offChart' } as const
    }
    return readings.get(chartUrls[index])?.[pin.id]
  }
  const spoken = shown
    .map((pin) => `${chartLabel(pin)}: ${describeRain(readingAt(pin))}`)
    .join('. ')

  const several = pins.length > 1
  // With one pin chosen of several, the selector names it: its row then needs no
  // name of its own, and shares a line with what it shows.
  const selectorNamesRow = several && shown.length === 1

  const selector = (
    <>
      <label htmlFor={selectId} className="sr-only">
        Place for the rain strip
      </label>
      <span className="relative inline-flex max-w-[55%] min-w-0">
        <select
          id={selectId}
          value={selected}
          onChange={(event) => {
            track('rain_strip_pin_changed', {
              all_pins: event.target.value === ALL_PINS,
            })
            setChoice(event.target.value)
          }}
          className="border-rule bg-plate text-ink hover:bg-paper focus-visible:outline-cold min-h-8 w-full min-w-0 cursor-pointer appearance-none truncate rounded-full border py-1 pr-7 pl-3 font-mono text-xs font-semibold tracking-wide focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {pins.map((pin) => (
            <option key={pin.id} value={pin.id}>
              {chartLabel(pin)}
            </option>
          ))}
          <option value={ALL_PINS}>All places</option>
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className="text-ink-soft pointer-events-none absolute top-1/2 right-2.5 size-3 -translate-y-1/2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </span>
    </>
  )
  const readout = (pin: Pin) => (
    <span data-rain-reading className="shrink-0 text-right">
      {when && <span className="text-ink-soft">{when} · </span>}
      <strong className="text-ink font-semibold">
        {describeRain(readingAt(pin))}
      </strong>
    </span>
  )

  return (
    <div data-rain-strip className="pb-1">
      {several && !selectorNamesRow && <div className="mb-1">{selector}</div>}

      {shown.map((pin) => {
        const onChart =
          chartPosition(region, pin.latitude, pin.longitude) !== undefined
        return (
          <div key={pin.id} data-rain-row={pin.id} className="mb-1">
            <p className="text-ink-soft flex items-center justify-between gap-2 font-mono text-[0.7rem] leading-4">
              {selectorNamesRow ? (
                selector
              ) : (
                <span className="text-ink truncate font-semibold">
                  {chartLabel(pin)}
                </span>
              )}
              {readout(pin)}
            </p>
            {onChart && (
              <div
                aria-hidden="true"
                className="relative mt-0.5 h-4 pointer-coarse:h-6"
              >
                {chartUrls.map((url, position) => {
                  const reading = readings.get(url)?.[pin.id]
                  const colour = cellColour(reading)
                  return (
                    <button
                      key={url}
                      type="button"
                      tabIndex={-1}
                      data-rain-cell={position}
                      data-reading={reading?.kind ?? 'unknown'}
                      onClick={() => {
                        track('rain_strip_cell_tapped', {
                          all_pins: selected === ALL_PINS,
                        })
                        onSeek(position)
                      }}
                      // Edged top and bottom (and at the ends), so a dry week, all
                      // the chart's pale lavender, still reads as a strip and not as
                      // nothing; a faint line between cells shows each chart.
                      className={
                        'border-ink/25 absolute top-0 h-full -translate-x-1/2 border-y first:rounded-l-sm first:border-l last:rounded-r-sm last:border-r ' +
                        (colour ? '' : 'bg-rule/40 ') +
                        (position === index
                          ? 'shadow-[inset_0_-3px_0_0_var(--color-ink)]'
                          : 'shadow-[inset_1px_0_0_0_rgb(0_0_0/0.07)]') +
                        (highlights[pin.id] &&
                        position >= highlights[pin.id].from &&
                        position <= highlights[pin.id].to
                          ? ' outline-ink z-10 outline-2 -outline-offset-1'
                          : '')
                      }
                      data-heavy-rain={
                        highlights[pin.id] &&
                        position >= highlights[pin.id].from &&
                        position <= highlights[pin.id].to
                          ? ''
                          : undefined
                      }
                      style={{
                        left: axis.percent(position),
                        // A little over, so neighbours meet without a hairline.
                        width: Math.max(axis.pixelsPerChart, 4) + 0.5,
                        backgroundColor: colour,
                        backgroundImage: colour ? undefined : UNREAD,
                      }}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      <p role="status" className="sr-only">
        {spoken}
      </p>
    </div>
  )
}
