'use client'
import { useCallback, useSyncExternalStore } from 'react'

import {
  DEFAULT_TIME_ZONE,
  formatInTimeZone,
  getBrowserTimeZone,
} from '@/shared/helpers/timeZone'

// The viewer's zone doesn't change during a page view, so nothing to subscribe to.
const subscribe = () => () => {}
const getServerSnapshot = () => DEFAULT_TIME_ZONE

/**
 * Returns a formatter that shows times in the viewer's own zone without a
 * hydration mismatch. The server and the hydration pass use the default zone
 * (`getServerSnapshot`); React then re-renders with the browser's zone if it
 * differs.
 */
export function useFormatDate() {
  const timeZone = useSyncExternalStore(
    subscribe,
    getBrowserTimeZone,
    getServerSnapshot,
  )

  return useCallback(
    (date: Date | number | string, formatString: string) =>
      formatInTimeZone(date, formatString, timeZone),
    [timeZone],
  )
}
