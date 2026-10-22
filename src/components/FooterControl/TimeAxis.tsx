'use client'
import {
  ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useFormatDate } from '@/components/Hooks/useFormatDate'

import {
  dayBoundaries,
  namedDays,
  nowPosition,
  visibleTicks,
} from './axisGeometry'
import { useElementWidth } from './useElementWidth'

/**
 * A forecast timeline: one tick for each chart, a longer one at each local
 * midnight with the day's name, a red tick for now, and a handle on the chart
 * you are looking at.
 *
 * The control itself is the browser's own range input, laid invisibly over the
 * drawing, so keyboard, touch, screen readers and focus all behave as they do
 * for any slider. The drawing is for the eye only.
 */
// Closer than this and neighbouring ticks stop reading as separate marks.
const MIN_TICK_SPACING_PX = 20
// Closer than this and two day names run together.
const MIN_DAY_NAME_SPACING_PX = 48
// Roughly a phone, used until the axis has been measured.
const ASSUMED_WIDTH_PX = 280
// Half the (touch) handle, in rem and px, kept clear at each end of the track.
// The input's thumb is twice this wide (w-6) so its centre runs from inset to inset.
const INSET = '0.75rem'
const INSET_PX = 12

export function TimeAxis({
  times,
  index,
  max,
  onSeek,
  glideMs,
  above,
}: {
  /** When each chart is for (epoch ms), in chart order. May be empty. */
  times: readonly number[]
  index: number
  max: number
  onSeek: (index: number) => void
  /**
   * While playing, how long each chart is shown. The handle then glides toward
   * the next chart over exactly this long, instead of hopping once per chart.
   */
  glideMs?: number
  /**
   * Something drawn just above the axis that has to line up with it, given where
   * each chart is: `percent(position)` is the CSS left of chart `position`, and
   * `pixelsPerChart` the width between neighbouring charts.
   */
  above?: (axis: {
    percent: (position: number) => string
    pixelsPerChart: number
  }) => ReactNode
}) {
  const formatDate = useFormatDate()
  const [axisRef, width] = useElementWidth<HTMLDivElement>(ASSUMED_WIDTH_PX)

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
  const ticks = useMemo(
    () =>
      new Set(
        visibleTicks(times.length, width - 2 * INSET_PX, MIN_TICK_SPACING_PX),
      ),
    [times.length, width],
  )
  // A minor tick on a day line only looks like a heavier day line.
  const pixelsPerChart = max > 0 ? (width - 2 * INSET_PX) / max : 0
  const named = namedDays(days, pixelsPerChart, MIN_DAY_NAME_SPACING_PX)
  const underDayLine = (position: number) =>
    days.some((day) => Math.abs(day.position - position) * pixelsPerChart < 3)
  const nowAt = now === undefined ? undefined : nowPosition(times, now)

  // 0 at the first chart, 1 at the last.
  const ratio = (position: number) =>
    max > 0 ? Math.min(Math.max(position / max, 0), 1) : 0
  // The track stops half a handle short of each edge, so the handle at the first
  // or last chart stays clear of the controls beside the axis.
  const percent = (position: number) =>
    `calc(${INSET} + (100% - 2 * ${INSET}) * ${ratio(position)})`

  const labelPlace = (position: number) =>
    `clamp(2.9rem, ${percent(position)}, calc(100% - 2.9rem))`

  // Gliding is driven frame by frame on the elements themselves, not through
  // React: re-rendering sixty times a second for a moving marker would be waste.
  const handleRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const changedAt = useRef(0)
  useEffect(() => {
    changedAt.current = performance.now()
  }, [index])

  const place = (position: number) => {
    if (handleRef.current) {
      handleRef.current.style.left = percent(position)
      handleRef.current.dataset.at = String(ratio(position))
    }
    if (labelRef.current) {
      labelRef.current.style.left = labelPlace(position)
      labelRef.current.dataset.at = String(ratio(position))
    }
  }
  // What the cleanup below needs, from the latest render rather than the one the
  // glide started in.
  const latest = useRef({ index, place })
  useLayoutEffect(() => {
    latest.current = { index, place }
  })
  const gliding =
    glideMs !== undefined &&
    glideMs > 0 &&
    max > 0 &&
    !(
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
    )

  useEffect(() => {
    if (!gliding) return
    let frame = 0
    const step = (now: number) => {
      const fraction = Math.min(
        Math.max((now - changedAt.current) / glideMs!, 0),
        1,
      )
      // Toward the next chart, arriving as it appears; the last chart has none.
      place(Math.min(index + fraction, max))
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
    // `place` closes over this render's values, which are what this loop needs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gliding, glideMs, index, max])

  // When playback stops, put the marker back on the chart it is on: React will
  // not, because as far as it knows nothing moved.
  useEffect(() => {
    if (!gliding) return
    return () => {
      latest.current.place(latest.current.index)
    }
  }, [gliding])

  const current = times[index]
  const handleLabel =
    current === undefined ? '' : formatDate(current, 'EEE HH:mm')

  return (
    <div data-footer-slider className="min-w-0 grow basis-auto">
      {above?.({ percent, pixelsPerChart })}
      <div
        ref={axisRef} // Taller where there is a finger, so the bigger handle clears the label above it.
        className="relative h-14 pointer-coarse:h-[4.25rem]"
      >
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={index}
          onChange={(event) => onSeek(Number(event.target.value))}
          aria-label="Chart position"
          aria-valuetext={`Chart ${index + 1} of ${max + 1}`}
          // Invisible, but it takes every touch and key press. Its thumb is as wide
          // as the two insets and as tall as the axis: iOS only starts dragging a
          // slider that is pressed on its thumb, so a thumb of no size could not be
          // dragged at all. The thumb's centre then runs exactly where the drawn
          // handle does, from one inset to the other.
          className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-ew-resize touch-none appearance-none bg-transparent opacity-0 [&::-moz-range-thumb]:h-14 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-0 pointer-coarse:[&::-moz-range-thumb]:h-[4.25rem] [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:h-14 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none pointer-coarse:[&::-webkit-slider-thumb]:h-[4.25rem]"
        />

        <div
          data-axis-drawing
          aria-hidden="true"
          className="peer-focus-visible:outline-cold pointer-events-none absolute inset-0 rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2"
        >
          <div className="bg-rule absolute right-0 bottom-[1.05rem] left-0 h-0.5" />

          {times.map((time, position) =>
            ticks.has(position) && !underDayLine(position) ? (
              <i
                key={time}
                data-tick
                className="bg-ink-soft/70 absolute bottom-[1.05rem] h-1.5 w-px"
                style={{ left: percent(position) }}
              />
            ) : null,
          )}

          {days.map((day) => (
            <i
              key={day.position}
              className="bg-ink absolute bottom-[1.05rem] h-4 w-px"
              style={{ left: percent(day.position) }}
            >
              {named.has(day.position) && (
                <em className="font-display text-ink-soft absolute top-[calc(100%+0.35rem)] left-1 text-xs font-semibold tracking-widest whitespace-nowrap uppercase not-italic">
                  {day.label}
                </em>
              )}
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
            ref={handleRef}
            data-handle
            data-at={ratio(index)}
            // Bigger where there is a finger instead of a mouse.
            className="bg-ink ring-plate absolute bottom-[0.3rem] h-7 w-4 -translate-x-1/2 rounded-full ring-[3px] transition-[left] duration-200 ease-out motion-reduce:transition-none pointer-coarse:bottom-[0.1rem] pointer-coarse:h-10 pointer-coarse:w-6"
            // No easing while gliding: the glide is the animation.
            style={{
              left: percent(index),
              transition: gliding ? 'none' : undefined,
            }}
          >
            <span className="bg-paper absolute inset-y-1.5 left-1/2 w-0.5 -translate-x-1/2 rounded-full" />
          </div>

          {handleLabel && (
            <span
              ref={labelRef}
              data-handle-label
              data-at={ratio(index)}
              // Kept inside the axis, clear of the controls beside it.
              className="bg-ink text-paper absolute top-0 -translate-x-1/2 rounded-sm px-1.5 py-1 font-mono text-xs leading-none font-medium whitespace-nowrap"
              style={{ left: labelPlace(index) }}
            >
              {handleLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
