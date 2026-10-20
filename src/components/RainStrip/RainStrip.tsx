'use client'
import { useAtom } from 'jotai'
import { useId } from 'react'

import { rainStripPinAtom } from '@/components/Atoms/GlobalState'
import { useFormatDate } from '@/components/Hooks/useFormatDate'
import { chartPosition } from '@/shared/helpers/chartGeometry'
import { chartLabel, type Pin } from '@/shared/helpers/pins/pins'
import { RAIN_BANDS } from '@/shared/helpers/rainBands'
import type { RainReading } from '@/shared/helpers/rainStrip/readRain'
import type { RegionCode } from '@/shared/types/region'

import { ALL_PINS, chosenPins, describeRain } from './describeRain'
import type { RainReadings } from './useRainReadings'

// The chart's own background, which is what a clear cell is: nothing to show.
const CLEAR = '#e6e6ff'

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
}: {
  region: RegionCode
  pins: readonly Pin[]
  chartUrls: readonly string[]
  times: readonly number[]
  index: number
  readings: RainReadings
  onSeek: (index: number) => void
  /** Where each chart is on the time axis, so the cells line up with its ticks. */
  axis: {
    percent: (position: number) => string
    pixelsPerChart: number
  }
}) {
  const formatDate = useFormatDate()
  const [choice, setChoice] = useAtom(rainStripPinAtom)
  const selectId = useId()
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
        Pin for the rain strip
      </label>
      <select
        id={selectId}
        value={selected}
        onChange={(event) => setChoice(event.target.value)}
        className="border-rule bg-plate text-ink focus-visible:outline-cold min-h-8 max-w-[55%] min-w-0 truncate rounded border px-2 font-mono text-xs focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {pins.map((pin) => (
          <option key={pin.id} value={pin.id}>
            {chartLabel(pin)}
          </option>
        ))}
        <option value={ALL_PINS}>All pins</option>
      </select>
    </>
  )
  const readout = (pin: Pin) => (
    <span data-rain-reading className="shrink-0">
      {when && `${when} · `}
      {describeRain(readingAt(pin))}
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
                      onClick={() => onSeek(position)}
                      className={
                        'absolute top-0 h-full -translate-x-1/2 border-y ' +
                        (colour
                          ? 'border-ink-soft/30'
                          : 'border-rule border-dashed') +
                        (position === index ? ' ring-ink z-10 ring-2' : '')
                      }
                      style={{
                        left: axis.percent(position),
                        width: Math.max(axis.pixelsPerChart, 4),
                        backgroundColor: colour,
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
