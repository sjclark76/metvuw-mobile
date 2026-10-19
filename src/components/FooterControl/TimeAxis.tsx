'use client'
import { useEffect, useMemo, useState } from 'react'

import { useFormatDate } from '@/components/Hooks/useFormatDate'

import { dayBoundaries, nowPosition } from './axisGeometry'

/**
 * A forecast timeline: one tick for each chart, a longer one at each local
 * midnight with the day's name, a red tick for now, and a handle on the chart
 * you are looking at.
 *
 * The control itself is the browser's own range input, laid invisibly over the
 * drawing, so keyboard, touch, screen readers and focus all behave as they do
 * for any slider. The drawing is for the eye only.
 */
export function TimeAxis({
  times,
  index,
  max,
  onSeek,
}: {
  /** When each chart is for (epoch ms), in chart order. May be empty. */
  times: readonly number[]
  index: number
  max: number
  onSeek: (index: number) => void
}) {
  const formatDate = useFormatDate()

  // The clock is only read in the browser, after mount: the page is rendered
  // ahead of time on the host's clock, and a "now" that differs from the
  // visitor's would not match when React hydrates.
  const [now, setNow] = useState<number>()
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now())
  }, [])

  const days = useMemo(
    () =>
      dayBoundaries(times, {
        dayOf: (time) => formatDate(time, 'yyyy-MM-dd'),
        labelOf: (time) => formatDate(time, 'EEE'),
      }),
    [times, formatDate],
  )
  const nowAt = now === undefined ? undefined : nowPosition(times, now)

  const percent = (position: number) =>
    `${max > 0 ? Math.min(Math.max(position / max, 0), 1) * 100 : 0}%`

  const current = times[index]
  const handleLabel =
    current === undefined ? '' : formatDate(current, 'EEE HH:mm')

  return (
    <div className="relative h-14 min-w-0 grow basis-auto">
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={index}
        onChange={(event) => onSeek(Number(event.target.value))}
        aria-label="Chart position"
        aria-valuetext={`Chart ${index + 1} of ${max + 1}`}
        // Invisible, but it takes every touch and key press. No thumb width, so
        // a press maps to the chart under the finger all the way to the ends.
        className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-ew-resize touch-none appearance-none bg-transparent opacity-0 [&::-moz-range-thumb]:size-0 [&::-webkit-slider-thumb]:size-0"
      />

      <div
        data-axis-drawing
        aria-hidden="true"
        className="peer-focus-visible:outline-cold pointer-events-none absolute inset-0 rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2"
      >
        <div className="bg-rule absolute right-0 bottom-[1.05rem] left-0 h-0.5" />

        {times.map((time, position) => (
          <i
            key={time}
            data-tick
            className="bg-ink-soft absolute bottom-[1.05rem] h-2 w-px"
            style={{ left: percent(position) }}
          />
        ))}

        {days.map((day) => (
          <i
            key={day.position}
            className="bg-ink absolute bottom-[1.05rem] h-4 w-px"
            style={{ left: percent(day.position) }}
          >
            <em className="font-display text-ink-soft absolute top-[calc(100%+0.35rem)] left-1 text-xs font-semibold tracking-widest whitespace-nowrap uppercase not-italic">
              {day.label}
            </em>
          </i>
        ))}

        {nowAt !== undefined && (
          <i
            data-now
            className="bg-warm absolute bottom-[0.55rem] h-6 w-0.5"
            style={{ left: percent(nowAt) }}
          >
            <span className="text-warm absolute top-[calc(100%+0.2rem)] left-1/2 -translate-x-1/2 font-mono text-[0.62rem] font-medium tracking-widest uppercase">
              Now
            </span>
          </i>
        )}

        <div
          data-handle
          className="bg-ink ring-plate absolute bottom-[0.45rem] h-6 w-3.5 -translate-x-1/2 rounded-full ring-[3px] transition-[left] duration-200 ease-out motion-reduce:transition-none"
          style={{ left: percent(index) }}
        >
          <span className="bg-paper absolute inset-y-1.5 left-1/2 w-0.5 -translate-x-1/2 rounded-full" />
        </div>

        {handleLabel && (
          <span
            // Kept inside the axis, clear of the controls beside it.
            className="bg-ink text-paper absolute top-0 -translate-x-1/2 rounded-sm px-1.5 py-1 font-mono text-xs leading-none font-medium whitespace-nowrap"
            style={{
              left: `clamp(2.9rem, ${percent(index)}, calc(100% - 2.9rem))`,
            }}
          >
            {handleLabel}
          </span>
        )}
      </div>
    </div>
  )
}
