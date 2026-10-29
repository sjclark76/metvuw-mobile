import type { ReactNode } from 'react'

import type { SoundingSummary } from '@/shared/helpers/sounding/summariseSounding'
import { DEFAULT_TIME_ZONE, formatInTimeZone } from '@/shared/helpers/timeZone'

/** A height for reading: "1,500". */
export const formatHeight = (m: number) => m.toLocaleString('en-NZ')

/** A temperature for reading, with a true minus sign: "−14". */
export const formatTemperature = (c: number) =>
  `${Math.round(c) < 0 ? '−' : ''}${Math.abs(Math.round(c))}`

/** When the balloon went up, as people say it: "Friday 1:00am". */
export const balloonTime = (launchUTC: number) =>
  formatInTimeZone(launchUTC, 'EEEE h:mmaaa', DEFAULT_TIME_ZONE)

const to100 = (m: number) => formatHeight(Math.round(m / 100) * 100)

function Line({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <li className="border-rule grid grid-cols-[1.25rem_1fr] gap-2 border-t py-1.5 first:border-t-0">
      <span aria-hidden="true" className="text-center">
        {icon}
      </span>
      <span>{children}</span>
    </li>
  )
}

/**
 * What the latest weather balloon found, in plain words, above the chart. Only
 * what the data supports is said: a line is left out rather than guessed, and a
 * gap in the readings is stated.
 */
export function SoundingGlance({
  summary,
  launchUTC,
  sourceUrl,
}: {
  summary: SoundingSummary
  launchUTC: number
  sourceUrl: string
}) {
  const { freezing, cloud, winds, tempAt3kmC, stability } = summary
  // Without cloud, say how high the dry air was checked: no readings below a gap.
  const dry =
    summary.gapBelowM === undefined
      ? 'Dry: no cloud layers'
      : `Dry above ${formatHeight(summary.gapBelowM)} m: no cloud layers`

  return (
    <section
      aria-label="At a glance"
      className="bg-plate border-cold mx-auto mb-4 max-w-176 border-l-4 px-4 py-3 text-sm leading-snug"
    >
      <h2 className="font-display mb-2 text-lg font-bold tracking-wide uppercase">
        At a glance
      </h2>
      <ul>
        {summary.gapBelowM !== undefined && (
          <Line icon="↧">
            No readings below {formatHeight(summary.gapBelowM)} m from this
            balloon
          </Line>
        )}
        {freezing?.kind === 'ground' && (
          <Line icon="❄︎">
            <b>Freezing at ground level</b>
          </Line>
        )}
        {freezing?.kind === 'height' && (
          <Line icon="❄︎">
            <b>Freezing level {formatHeight(freezing.m)} m</b>
          </Line>
        )}
        <Line icon="☁︎">
          {cloud.length === 0 ? (
            dry
          ) : (
            <>
              <b>Cloud</b>{' '}
              {cloud
                .map((layer) => `${to100(layer.fromM)} – ${to100(layer.toM)} m`)
                .join(', ')}
            </>
          )}
        </Line>
        {summary.inversion && (
          <Line icon="≋">
            Inversion near the ground: fog, haze or smog can be trapped
          </Line>
        )}
        {winds.length > 0 && (
          <Line icon="➚">
            <b>Wind</b>{' '}
            {winds
              .map((wind) => `${wind.compass} ${wind.kt} kt at ${wind.atKm} km`)
              .join(' · ')}
          </Line>
        )}
        {tempAt3kmC !== undefined && (
          <Line icon="🌡︎">
            <b>{formatTemperature(tempAt3kmC)} °C at 3,000 m</b>
          </Line>
        )}
        {stability && (
          <Line icon="ϟ">
            {stability === 'unstable'
              ? 'Unstable: thunderstorms possible'
              : 'Stable: thunderstorms unlikely'}
          </Line>
        )}
      </ul>
      <p className="text-ink-soft mt-2 font-mono text-xs">
        From {balloonTime(launchUTC)}&apos;s balloon ·{' '}
        <a href={sourceUrl} className="underline underline-offset-2">
          University of Wyoming data
        </a>
        . What the balloon measured, not a forecast.
      </p>
    </section>
  )
}
