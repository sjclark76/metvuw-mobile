import { useId } from 'react'

import type {
  Sounding,
  SoundingLevel,
} from '@/shared/helpers/sounding/parseSounding'
import {
  nearestLevel,
  type SoundingSummary,
} from '@/shared/helpers/sounding/summariseSounding'
import { DEFAULT_TIME_ZONE, formatInTimeZone } from '@/shared/helpers/timeZone'

import { balloonTime, formatHeight } from './SoundingGlance'

// The chart's own units: 358 wide, and the plot inside the margins.
const WIDTH = 358
const HEIGHT = 470
const LEFT = 34
const RIGHT = 300
const TOP = 24
const BOTTOM = 440
const TOP_M = 10_000
const MIN_C = -80
const MAX_C = 35
// One point per 100 m is plenty to draw: a sounding has thousands of levels.
const POINT_EVERY_M = 100

const x = (c: number) => LEFT + ((c - MIN_C) / (MAX_C - MIN_C)) * (RIGHT - LEFT)
const y = (m: number) => BOTTOM - (m / TOP_M) * (BOTTOM - TOP)

/**
 * The latest balloon's sounding, drawn simply: height up the side, temperature
 * and dew point across, with cloud shaded, the freezing level marked, and the
 * wind at each kilometre. Shown in place of metvuw's tephigram when that is
 * older than the balloon.
 */
export function SoundingChart({
  sounding,
  summary,
  launchUTC,
  sourceUrl,
  metvuwNewestUTC,
}: {
  sounding: Sounding
  summary: SoundingSummary
  launchUTC: number
  sourceUrl: string
  metvuwNewestUTC?: number
}) {
  const points: SoundingLevel[] = []
  let lastM = -Infinity
  for (const level of sounding.levels) {
    if (level.heightM > TOP_M) break
    if (level.heightM - lastM >= POINT_EVERY_M) {
      points.push(level)
      lastM = level.heightM
    }
  }
  const path = (value: (level: SoundingLevel) => number) =>
    points
      .map(
        (level, i) =>
          `${i ? 'L' : 'M'}${x(value(level)).toFixed(1)},${y(level.heightM).toFixed(1)}`,
      )
      .join('')

  const winds = [1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((km) => {
    const level = nearestLevel(sounding.levels, km * 1000)
    return level ? [{ km, level }] : []
  })
  const freezingM =
    summary.freezing?.kind === 'height' ? summary.freezing.m : undefined
  const when = balloonTime(launchUTC)
  const clipId = useId()

  return (
    <figure className="mx-auto max-w-176 px-4 md:px-0">
      <div className="bg-plate rounded-xl p-2 shadow-lg">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Balloon sounding: temperature and dew point by height, with cloud, the freezing level and wind"
          className="block w-full font-mono text-[11px]"
        >
          {/* Readings outside the temperature range are cut at the plot's edge,
              rather than drawn over the wind column. */}
          <defs>
            <clipPath id={clipId}>
              <rect
                x={LEFT}
                y={TOP}
                width={RIGHT - LEFT}
                height={BOTTOM - TOP}
              />
            </clipPath>
          </defs>
          {[0, 2, 4, 6, 8, 10].map((km) => (
            <g key={km}>
              <line
                x1={LEFT}
                x2={RIGHT}
                y1={y(km * 1000)}
                y2={y(km * 1000)}
                className="stroke-rule"
              />
              <text
                x={LEFT - 6}
                y={y(km * 1000) + 4}
                textAnchor="end"
                className="fill-ink-soft"
              >
                {km}
              </text>
            </g>
          ))}
          {[-80, -60, -40, -20, 0, 20].map((c) => (
            <text
              key={c}
              x={x(c)}
              y={BOTTOM + 16}
              textAnchor="middle"
              className="fill-ink-soft"
            >
              {c}°
            </text>
          ))}
          <text
            x={LEFT - 6}
            y={TOP - 12}
            textAnchor="end"
            className="fill-ink-soft"
          >
            km
          </text>
          <text
            x={322}
            y={TOP - 12}
            textAnchor="middle"
            className="fill-ink-soft"
          >
            kt
          </text>
          {summary.cloud
            .filter((layer) => layer.fromM < TOP_M)
            .map((layer) => (
              <rect
                key={layer.fromM}
                data-cloud
                clipPath={`url(#${clipId})`}
                x={LEFT}
                width={RIGHT - LEFT}
                y={y(Math.min(layer.toM, TOP_M))}
                height={y(layer.fromM) - y(Math.min(layer.toM, TOP_M))}
                className="fill-cold/15"
              />
            ))}
          {freezingM !== undefined && freezingM < TOP_M && (
            <g data-freezing>
              <line
                x1={LEFT}
                x2={RIGHT}
                y1={y(freezingM)}
                y2={y(freezingM)}
                strokeDasharray="6 4"
                className="stroke-warm"
              />
              <text
                x={LEFT + 4}
                y={y(freezingM) - 5}
                textAnchor="start"
                className="fill-warm"
              >
                FREEZING {formatHeight(freezingM)} m
              </text>
            </g>
          )}
          <path
            data-line="dew-point"
            clipPath={`url(#${clipId})`}
            d={path((level) => level.dewPointC)}
            fill="none"
            strokeWidth={2.2}
            className="stroke-cold"
          />
          <path
            data-line="temperature"
            clipPath={`url(#${clipId})`}
            d={path((level) => level.tempC)}
            fill="none"
            strokeWidth={2.6}
            className="stroke-warm"
          />
          {winds.map(({ km, level }) => (
            // The arrow points where the wind blows to.
            <g key={km} data-wind>
              <g
                transform={`translate(322,${y(km * 1000)}) rotate(${level.windFromDeg + 180})`}
              >
                <line y1={8} y2={-8} strokeWidth={2} className="stroke-ink" />
                <path
                  d="M-4,-3 L0,-9 L4,-3"
                  fill="none"
                  strokeWidth={2}
                  className="stroke-ink"
                />
              </g>
              <text x={335} y={y(km * 1000) + 4} className="fill-ink-soft">
                {level.windKt}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <figcaption className="text-ink-soft mt-2 space-y-1 font-mono text-xs">
        <p>
          {metvuwNewestUTC !== undefined
            ? `metvuw's charts stop at ${formatInTimeZone(metvuwNewestUTC, 'd MMM', DEFAULT_TIME_ZONE)}; this chart is drawn from ${when}'s balloon.`
            : `This chart is drawn from ${when}'s balloon.`}
        </p>
        <p>
          {/* The words aren't coloured: the red text fails contrast at caption size. */}
          <span className="inline-flex items-center gap-1">
            <svg
              aria-hidden="true"
              width="14"
              height="4"
              className="inline-block"
            >
              <line
                x1="0"
                y1="2"
                x2="14"
                y2="2"
                strokeWidth="3"
                className="stroke-warm"
              />
            </svg>
            temperature
          </span>{' '}
          <span className="inline-flex items-center gap-1">
            <svg
              aria-hidden="true"
              width="14"
              height="4"
              className="inline-block"
            >
              <line
                x1="0"
                y1="2"
                x2="14"
                y2="2"
                strokeWidth="3"
                className="stroke-cold"
              />
            </svg>
            dew point
          </span>{' '}
          Where they meet, the air is saturated: cloud. Arrows show where the
          wind blows to, with its speed in knots. ·{' '}
          <a href={sourceUrl} className="underline underline-offset-2">
            University of Wyoming data
          </a>
        </p>
      </figcaption>
    </figure>
  )
}
