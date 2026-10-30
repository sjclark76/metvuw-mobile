'use client'
import { useAtomValue } from 'jotai'
import { createContext, type ReactNode, useContext, useMemo } from 'react'

import { useAnimation } from '@/components/Animation/Animation'
import { showHeavyRainAtom } from '@/components/Atoms/GlobalState'
import { useNow } from '@/components/Hooks/useNow'
import { usePins } from '@/components/Pins/usePins'
import { chartPosition } from '@/shared/helpers/chartGeometry'
import { heavyRainAhead } from '@/shared/helpers/heavyRain'
import {
  alertsForPins,
  type PinAlert,
} from '@/shared/helpers/warnings/alertsForPins'
import type { RegionCode } from '@/shared/types/region'

import type { PinHeavyRain } from './HeavyRainNote'
import { useChartsSettled } from './useChartsSettled'
import { type RainReadings, useRainReadings } from './useRainReadings'
import { useWeatherAlerts } from './useWeatherAlerts'

interface RainWatch {
  /** What each chart shows at each pin, as far as it has been read. */
  readings: RainReadings
  /** Heavy rain ahead at the pins, from the charts read so far. */
  heavyRain: readonly PinHeavyRain[]
  /** The cells of the rain strip to outline, for each pin with heavy rain. */
  highlights: Record<string, { from: number; to: number }>
  /** Whether there are pins on this chart and warnings are on in Settings. */
  watching: boolean
  /** Whether every chart has been read at every pin on this chart. */
  checked: boolean
  /** MetService alerts covering the visitor's pins, worst first. */
  alerts: readonly PinAlert[]
}

const RainWatchContext = createContext<RainWatch | null>(null)

/**
 * Reads the region's rain charts at the visitor's pins, once, for everything on
 * the page that needs them: the rain strip in the footer and the heavy rain note
 * at the top of the page. Reads happen even when the strip is hidden in Settings,
 * since the note needs them. It must be inside the animation, which says which
 * chart is in view and so which to read first.
 */
export function RainWatchProvider({
  region,
  chartUrls,
  children,
}: {
  region: RegionCode
  chartUrls: readonly string[]
  children: ReactNode
}) {
  const { index, times } = useAnimation()
  const { pins } = usePins()
  const showHeavyRain = useAtomValue(showHeavyRainAtom)
  // Fetched at page load, in step with the charts being read; matched below.
  const alerts = useWeatherAlerts(showHeavyRain && pins.length > 0)
  const chartsSettled = useChartsSettled()
  const readings = useRainReadings({
    region,
    chartUrls,
    current: index,
    pins,
    ready: chartsSettled,
  })

  // Nothing until the clock is known in the browser (zero before then).
  const now = useNow()
  const value = useMemo<RainWatch>(() => {
    const onChart = pins.filter((pin) =>
      chartPosition(region, pin.latitude, pin.longitude),
    )
    const watching = showHeavyRain && onChart.length > 0
    const heavyRain = watching && now !== 0
    const found: PinHeavyRain[] = heavyRain
      ? onChart.flatMap((pin) => {
          const rain = heavyRainAhead(
            chartUrls.map((url) => readings.get(url)?.[pin.id]),
            times,
            now,
          )
          return rain ? [{ pin, rain }] : []
        })
      : []
    return {
      readings,
      heavyRain: found,
      highlights: Object.fromEntries(
        found.map(({ pin, rain }) => [
          pin.id,
          { from: rain.from, to: rain.to },
        ]),
      ),
      watching,
      checked:
        watching &&
        now !== 0 &&
        chartUrls.every((url) =>
          onChart.every((pin) => pin.id in (readings.get(url) ?? {})),
        ),
      alerts: watching && now !== 0 ? alertsForPins(alerts, pins, now) : [],
    }
  }, [pins, region, showHeavyRain, now, chartUrls, readings, times, alerts])

  return (
    <RainWatchContext.Provider value={value}>
      {children}
    </RainWatchContext.Provider>
  )
}

const NOTHING: RainWatch = {
  readings: new Map(),
  heavyRain: [],
  highlights: {},
  watching: false,
  checked: false,
  alerts: [],
}

/** What the page's rain watch has found; nothing on a page without one. */
export function useRainWatch(): RainWatch {
  return useContext(RainWatchContext) ?? NOTHING
}
