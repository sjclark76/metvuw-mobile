'use client'
import { useEffect, useRef, useState } from 'react'

import { chartPosition } from '@/shared/helpers/chartGeometry'
import type { Pin } from '@/shared/helpers/pins/pins'
import {
  decodeChart,
  type RainReading,
  readRain,
} from '@/shared/helpers/rainStrip/readRain'
import type { RegionCode } from '@/shared/types/region'

/** What each chart shows at each pin: chart image address -> pin id -> reading. */
export type RainReadings = ReadonlyMap<string, Record<string, RainReading>>

const NONE: RainReadings = new Map()

// Between charts, give the page the chance to do what the visitor is doing.
const afterIdle = () =>
  new Promise<void>((resolve) =>
    typeof requestIdleCallback === 'function'
      ? requestIdleCallback(() => resolve(), { timeout: 500 })
      : setTimeout(resolve, 50),
  )

/**
 * What each chart shows at each of the visitor's pins, read from the chart images
 * once the page is idle: the chart being looked at first, then the rest, one
 * after another, each filling in as it is read. A chart that cannot be read
 * (offline and not cached, say) is left out, not guessed at. Reads for the pins
 * and charts already done are kept, so adding a pin reads only what is missing.
 */
export function useRainReadings({
  region,
  chartUrls,
  current,
  pins,
}: {
  region: RegionCode
  chartUrls: readonly string[]
  /** The chart being looked at, to be read first. */
  current: number
  pins: readonly Pin[]
}): RainReadings {
  const [readings, setReadings] = useState<RainReadings>(NONE)
  const done = useRef(new Map<string, Record<string, RainReading>>())
  const currentRef = useRef(current)
  useEffect(() => {
    currentRef.current = current
  })

  // Changes only when the charts, region or pins really change.
  const key = JSON.stringify([
    region,
    chartUrls,
    pins.map((pin) => [pin.id, pin.latitude, pin.longitude]),
  ])

  useEffect(() => {
    if (pins.length === 0 || chartUrls.length === 0) return
    const abort = new AbortController()
    const positions = Object.fromEntries(
      pins.map((pin) => [
        pin.id,
        chartPosition(region, pin.latitude, pin.longitude),
      ]),
    )

    const run = async () => {
      const order = [...chartUrls.keys()].sort(
        (a, b) =>
          Math.abs(a - currentRef.current) - Math.abs(b - currentRef.current),
      )
      for (const index of order) {
        const url = chartUrls[index]
        const have = done.current.get(url) ?? {}
        const missing = Object.fromEntries(
          Object.entries(positions).filter(([id]) => !(id in have)),
        )
        if (Object.keys(missing).length === 0) continue
        await afterIdle()
        if (abort.signal.aborted) return
        try {
          const chart = await decodeChart(url, abort.signal)
          if (abort.signal.aborted) return
          done.current.set(url, { ...have, ...readRain(chart, missing) })
          setReadings(new Map(done.current))
        } catch {
          // Leave this chart unread; the strip shows it as not known.
        }
      }
    }
    // A read is not started until the page has settled.
    void run()
    return () => abort.abort()
    // `key` stands for region, chartUrls and pins.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return pins.length === 0 ? NONE : readings
}
