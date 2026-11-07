'use client'
import { useAtomValue } from 'jotai'
import { useCallback, useSyncExternalStore } from 'react'

import { clockAtom } from '@/components/Atoms/GlobalState'
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
 * differs. The 24-hour token `HH:mm` is written as `h:mmaaa` when the visitor has
 * chosen the 12-hour clock in Settings; times already written 12-hour are left.
 */
export function useFormatDate() {
  const timeZone = useSyncExternalStore(
    subscribe,
    getBrowserTimeZone,
    getServerSnapshot,
  )

  const clock = useAtomValue(clockAtom)

  return useCallback(
    (date: Date | number | string, formatString: string) =>
      formatInTimeZone(
        date,
        clock === '12h'
          ? formatString.replace('HH:mm', 'h:mmaaa')
          : formatString,
        timeZone,
      ),
    [timeZone, clock],
  )
}
