'use client'
import { useEffect, useState } from 'react'

import type { WeatherAlert } from '@/shared/helpers/warnings/parseCapAlert'

/**
 * MetService's current alerts, fetched once when `enabled` first holds (the
 * visitor has pins and warnings on). Nothing while it is not, and nothing if the
 * request fails: the note then shows only what the charts say.
 */
export function useWeatherAlerts(enabled: boolean): readonly WeatherAlert[] {
  const [alerts, setAlerts] = useState<readonly WeatherAlert[]>([])

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    fetch('/api/warnings', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : undefined))
      .then((body) => {
        if (Array.isArray(body?.alerts)) setAlerts(body.alerts)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [enabled])

  return alerts
}
